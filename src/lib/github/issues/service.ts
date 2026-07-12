import { unstable_cache } from 'next/cache'
import { after } from 'next/server'

import { listUserBookmarkKeys } from '@/lib/bookmarks'
import { parseBatchParam } from '@/lib/github/batch'
import { GitHubRateLimitError, GitHubUnauthorizedError } from '@/lib/github/client'
import { withSingleFlight } from '@/lib/singleflight'
import {
    BACKGROUND_FETCH_SIZE,
    FOREGROUND_FETCH_SIZE,
    GITHUB_API_CACHE_TTL_SECONDS,
    PAGE_SIZE,
} from '@/constants/scoring-rules'
import type { IssueFilters } from '@/types/issue'
import type { IssueListPage } from '@/types/api'
import type { OnboardingProfile } from '@/lib/user/profile'
import { applyFilters, hasActiveFilters } from './filters'
import { rankIssues } from './ranking'
import { fetchCandidateIssues, type IssueSearchResult } from './search'

export type IssuePageData = IssueListPage

export type IssuePageError =
    | { error: 'invalid_batch' }
    | { error: 'rate_limited' }
    | { error: 'unauthorized' }
    | { error: 'fetch_failed' }

type FetchIssueListPageParams = {
    userId: string | null  // null = 게스트. 북마크 조회를 생략하고 공유 캐시를 사용한다.
    accessToken: string
    profile: OnboardingProfile
    filters: IssueFilters
    offset: number
    batchParam: string
}

export async function fetchIssueListPage({
    userId,
    accessToken,
    profile,
    filters,
    offset,
    batchParam,
}: FetchIssueListPageParams): Promise<IssuePageData | IssuePageError> {
    const parsedBatch = parseBatchParam(batchParam)
    if (!parsedBatch.ok) {
        return { error: 'invalid_batch' }
    }

    const cursor = parsedBatch.cursor
    const cacheUserId = userId ?? 'guest'
    const sortedLanguages = profile.topLanguages.slice().sort()
    const cacheKeyBase = ['github-issues', cacheUserId, ...sortedLanguages, batchParam]

    // 배치가 열리자마자 보여줄 소량(foreground)
    const getForegroundIssues = unstable_cache(
        () => fetchCandidateIssues(profile.topLanguages, accessToken, cursor, FOREGROUND_FETCH_SIZE),
        [...cacheKeyBase, 'foreground'],
        { revalidate: GITHUB_API_CACHE_TTL_SECONDS }
    )
    // 같은 배치를 더 깊이 스크롤할 때 대비해 미리 채워두는 대량(background) 버퍼
    const getFullBatchIssues = unstable_cache(
        () => fetchCandidateIssues(profile.topLanguages, accessToken, cursor, BACKGROUND_FETCH_SIZE),
        [...cacheKeyBase, 'full'],
        { revalidate: GITHUB_API_CACHE_TTL_SECONDS }
    )
    const foregroundKey = [...cacheKeyBase, 'foreground'].join('::')
    const fullBatchKey = [...cacheKeyBase, 'full'].join('::')

    // 배치의 첫 요청(offset=0) 시점에 background 버퍼 준비를 바로 시작한다.
    // 사용자가 foreground 분량(첫 몇 페이지)을 보는 동안 준비가 끝나도록, 최대한 이르게 트리거한다.
    if (offset === 0) {
        // 실패해도(rate limit 등) foreground 응답에는 영향 없으므로 조용히 무시한다 —
        // catch 없이 두면 unhandled rejection이 된다.
        after(() => { withSingleFlight(fullBatchKey, getFullBatchIssues).catch(() => {}) })
    }

    // foreground 범위 안에서는 대기 없이 빠른 소량 캐시를, 그 이후는 background 대량 캐시를 사용한다.
    // background가 아직 준비 안 된 상태에서 여기 도달하면 그 자리에서 계산되어 기다리게 될 수 있으나,
    // foreground가 미리 확보해준 시간만큼 그 빈도는 크게 줄어든다.
    //
    // unstable_cache는 "이미 끝난 계산"만 캐싱하고 아직 응답이 안 온 동시 요청끼리는 중복 계산해버리므로
    // (예: 빠른 스크롤로 같은 배치에 대한 요청이 겹치는 경우), withSingleFlight로 감싸서
    // 같은 key로 진행 중인 요청이 있으면 그 결과를 공유하도록 한다.
    const bookmarkPromise = userId ? listUserBookmarkKeys(userId) : Promise.resolve([])

    let searchResult: IssueSearchResult
    try {
        searchResult = await (offset < FOREGROUND_FETCH_SIZE
            ? withSingleFlight(foregroundKey, getForegroundIssues)
            : withSingleFlight(fullBatchKey, getFullBatchIssues))
    } catch (error) {
        if (error instanceof GitHubRateLimitError) return { error: 'rate_limited' }
        if (error instanceof GitHubUnauthorizedError) return { error: 'unauthorized' }
        return { error: 'fetch_failed' }
    }

    const bookmarkKeys = new Set(await bookmarkPromise)
    const rankedIssues = rankIssues(searchResult.issues, profile).map((issue) => ({
        ...issue,
        isBookmarked: bookmarkKeys.has(`${issue.repoFullName}#${issue.number}`),
    }))

    const availableLanguages = [...new Set(
        rankedIssues.flatMap((issue) => issue.language !== null ? [issue.language] : [])
    )]

    const allIssues = applyFilters(rankedIssues, filters)
    const pageIssues = allIssues.slice(offset, offset + PAGE_SIZE)
    const isActiveFilterResultUnderfilled = hasActiveFilters(filters) && pageIssues.length < PAGE_SIZE

    // foreground(30개)는 GitHub에 더 있어도 raw fetch 크기 자체가 작아 total이 실제보다 작게 나온다.
    // 이걸 그대로 배치 종료 신호로 쓰면, background(100개) 구간(offset>=FOREGROUND_FETCH_SIZE)에
    // 도달하기도 전에 매번 새 배치로 넘어가버려 background 캐시가 영영 쓰이지 못한다.
    // GitHub에 더 있는 한(hasMoreOnGithub) foreground 구간에서는 total을 그 경계 너머로 보정해
    // 같은 배치 안에서 offset이 자연스럽게 background 구간까지 이어지도록 한다.
    // 단, 활성 필터로 인한 underfill은 이 보정과 무관하게 별도로(canLoadMoreCandidates) 처리해야 하므로 제외한다.
    const isWithinForegroundRange = offset < FOREGROUND_FETCH_SIZE
    const shouldInflateTotal = isWithinForegroundRange && searchResult.hasMoreOnGithub && !isActiveFilterResultUnderfilled
    const reportedTotal = shouldInflateTotal
        ? Math.max(allIssues.length, FOREGROUND_FETCH_SIZE + 1)
        : allIssues.length

    const isLastPage = offset + PAGE_SIZE >= reportedTotal
    const canAutoRequestNextBatch = searchResult.hasMoreOnGithub && !isActiveFilterResultUnderfilled

    const candidateNextBatch = isLastPage && searchResult.hasMoreOnGithub
        ? searchResult.endCursor
        : null

    return {
        issues: pageIssues,
        total: reportedTotal,
        hasMore: !isLastPage || canAutoRequestNextBatch,
        offset,
        batch: batchParam,
        nextBatch: candidateNextBatch,
        canLoadMoreCandidates: candidateNextBatch !== null && !canAutoRequestNextBatch,
        availableLanguages,
    }
}
