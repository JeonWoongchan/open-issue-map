import { unstable_cache } from 'next/cache'
import { after } from 'next/server'

import { listUserBookmarkKeys } from '@/lib/bookmarks'
import { GitHubRateLimitError, GitHubUnauthorizedError } from '@/lib/github/client'
import { withSingleFlight } from '@/lib/singleflight'
import {
    EXPLORE_BACKGROUND_FETCH_SIZE,
    EXPLORE_FOREGROUND_FETCH_SIZE,
    EXPLORE_INITIAL_BATCH,
    GITHUB_API_CACHE_TTL_SECONDS,
} from '@/constants/scoring-rules'
import { LANGUAGE_GROUP_PRESETS } from '@/constants/explore-presets'
import type { IssueFilters, IssueSort } from '@/types/issue'
import type { IssueListPage } from '@/types/api'
import type { OnboardingProfile } from '@/lib/user/profile'
import { applyFilters } from './filters'
import { rankIssues } from './ranking'
import { buildExploreQuery, fetchExploreIssues, type IssueSearchResult } from './search'

export type IssuePageData = IssueListPage

export type IssuePageError =
    | { error: 'rate_limited' }
    | { error: 'unauthorized' }
    | { error: 'fetch_failed' }

type FetchIssueExplorePageParams = {
    userId: string | null  // null = 게스트. 북마크 조회를 생략한다.
    accessToken: string
    profile: OnboardingProfile
    filters: IssueFilters
    query: string
    sort: IssueSort
    githubLabel: string | null
    languageGroup: string | null
    offset: number
    batch: string  // EXPLORE_INITIAL_BATCH 또는 이전 응답의 nextBatch
}

export async function fetchIssueExplorePage({
    userId,
    accessToken,
    profile,
    filters,
    query,
    sort,
    githubLabel,
    languageGroup,
    offset,
    batch,
}: FetchIssueExplorePageParams): Promise<IssuePageData | IssuePageError> {
    const languages = languageGroup
        ? LANGUAGE_GROUP_PRESETS.find((group) => group.key === languageGroup)?.languages ?? []
        : []

    const searchQuery = buildExploreQuery({ text: query, languages, githubLabel, sort })
    const cursor = batch === EXPLORE_INITIAL_BATCH ? null : batch

    // 검색 쿼리 자체가 사용자와 무관한 공개 GitHub 데이터라, 캐시 키에 사용자 식별자를 넣지
    // 않는다 — README 캐시 키 버그(사용자 토큰까지 키에 섞여 같은 공개 저장소인데도 캐시가
    // 갈라지던 문제, src/lib/github/readme.ts 참고)와 같은 종류의 실수를 여기서는 피한다.
    const cacheKeyBase = ['github-issues-explore', searchQuery, batch]

    // 배치 티어(foreground/background)별 unstable_cache 래퍼 + singleflight key를 한 번에 만든다 —
    // 키 배열을 두 번 따로 만들면 한쪽만 고쳤을 때 캐시 key와 singleflight key가 어긋날 수 있다.
    function makeCachedFetch(size: number, tier: 'foreground' | 'background') {
        const keyParts = [...cacheKeyBase, tier]
        return {
            key: keyParts.join('::'),
            fetch: unstable_cache(
                () => fetchExploreIssues(searchQuery, accessToken, cursor, size),
                keyParts,
                { revalidate: GITHUB_API_CACHE_TTL_SECONDS },
            ),
        }
    }

    const isWithinForegroundRange = offset < EXPLORE_FOREGROUND_FETCH_SIZE
    const primary = isWithinForegroundRange
        ? makeCachedFetch(EXPLORE_FOREGROUND_FETCH_SIZE, 'foreground')
        : makeCachedFetch(EXPLORE_BACKGROUND_FETCH_SIZE, 'background')

    // 배치의 첫 요청(offset=0)에서 foreground와 background를 동시에 시작한다 — background
    // 호출을 await 뒤(또는 after() 콜백 안)로 미루면 그만큼 완료 시점이 늦어지므로, 여기서
    // 바로 호출해 foreground와 병렬로 진행되게 한다. after()는 시작을 늦추는 용도가 아니라,
    // 응답 전송 후 서버리스 함수가 종료되며 이 promise가 중간에 끊기지 않도록 끝까지
    // 붙잡아두는 용도로만 쓴다.
    if (offset === 0) {
        const background = makeCachedFetch(EXPLORE_BACKGROUND_FETCH_SIZE, 'background')
        const backgroundPromise = withSingleFlight(background.key, background.fetch).catch(() => {})
        after(() => backgroundPromise)
    }

    const bookmarkPromise = userId ? listUserBookmarkKeys(userId) : Promise.resolve([])

    // unstable_cache는 "이미 끝난 계산"만 캐싱하고 아직 응답이 안 온 동시 요청끼리는 중복
    // 계산해버리므로(cache stampede), withSingleFlight로 감싸 같은 key로 진행 중인 요청이
    // 있으면 그 결과를 공유하도록 한다.
    let searchResult: IssueSearchResult
    try {
        searchResult = await withSingleFlight(primary.key, primary.fetch)
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

    // 난이도/진행상태/기여방식/최소점수/최소스타는 GitHub 쿼리로 보낼 수 없어 여기서만 거른다.
    // 배치 진행 여부(hasMore/nextBatch)는 이 필터링과 무관하게 raw fetch 결과 기준으로만
    // 판단한다 — 그래야 필터 때문에 이번 페이지가 적게(또는 0개) 나와도 별도 신호 없이
    // 무한스크롤이 같은 조건으로 다음 페이지를 자동으로 계속 가져온다.
    const pageIssues = applyFilters(rankedIssues, filters)
        .slice(offset, offset + EXPLORE_FOREGROUND_FETCH_SIZE)

    let hasMore: boolean
    let nextBatch: string | null

    if (isWithinForegroundRange) {
        // foreground(30개)만 본 상태 — 이 배치에 더 있는지는 아직 모르지만, GraphQL의
        // hasNextPage가 "이 first 개수 이후에 더 있는지"를 정확히 알려주므로 background
        // 결과를 기다리지 않고도 안전하게 판단할 수 있다. 다음 배치로 넘어갈지는 아직
        // 결정하지 않는다(항상 background 구간을 실제로 거친 뒤에만 결정한다) — 그렇지
        // 않으면 foreground 자체의(30개 지점) 커서로 nextBatch를 잘못 확정해버려서
        // background에 미리 채워둔 90개를 건너뛰게 된다.
        hasMore = searchResult.hasMoreOnGithub
        nextBatch = null
    } else {
        // background(90개)까지 실제로 본 상태 — 이 배치의 진짜 한도에 도달했는지 여기서
        // 처음 확정된다.
        const isBatchExhausted = offset + EXPLORE_FOREGROUND_FETCH_SIZE >= searchResult.issues.length
        hasMore = !isBatchExhausted || searchResult.hasMoreOnGithub
        nextBatch = isBatchExhausted && searchResult.hasMoreOnGithub ? searchResult.endCursor : null
    }

    return {
        issues: pageIssues,
        hasMore,
        offset,
        batch,
        nextBatch,
    }
}
