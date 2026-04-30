import { unstable_cache } from 'next/cache'
import { NextRequest } from 'next/server'

import { err, ErrorCode, ok } from '@/lib/api-response'
import { requireGithubToken } from '@/lib/auth-utils'
import { listUserBookmarkKeys } from '@/lib/bookmarks'
import { getRepoHealthMap } from '@/lib/github/issues/health'
import { rankIssues } from '@/lib/github/issues/ranking'
import { fetchCandidateIssues } from '@/lib/github/issues/search'
import { loadOnboardingProfile } from '@/lib/user/profile'
import { GITHUB_API_CACHE_TTL_SECONDS, PAGE_SIZE } from '@/constants/scoring-rules'
import { encodeBatch, decodeBatch, INITIAL_BATCH } from '@/lib/github/batch'
import { CONTRIBUTION_TYPES, EXPERIENCE_LEVELS } from '@/constants/contribution-levels'
import type { IssueFilters, ScoredIssue } from '@/types/issue'

const VALID_DIFFICULTY_LEVELS = new Set<string>(EXPERIENCE_LEVELS.map((l) => l.value))
const VALID_CONTRIBUTION_TYPES = new Set<string>(CONTRIBUTION_TYPES.map((t) => t.value))

function applyFilters(issues: ScoredIssue[], filters: IssueFilters): ScoredIssue[] {
    return issues.filter(
        (issue) =>
            (!filters.language || issue.language === filters.language) &&
            (!filters.difficultyLevel || issue.difficultyLevel === filters.difficultyLevel) &&
            (!filters.contributionType || issue.contributionType === filters.contributionType)
    )
}

export async function GET(req: NextRequest) {
    // GitHub 액세스 토큰 기반 인증
    const auth = await requireGithubToken(req)
    if (!auth.ok) return err(auth.error, auth.status, auth.code)

    // DB에서 온보딩 프로필 조회 — 선호 언어·경험 등 채점 기준으로 사용
    const profile = await loadOnboardingProfile(auth.userId)
    if (!profile) {
        return err('Onboarding not complete', 400, ErrorCode.ONBOARDING_REQUIRED)
    }

    // 클라이언트 요청 파라미터 파싱 — offset: 배치 내 위치, batch: GitHub cursor 묶음, 필터
    const { searchParams } = new URL(req.url)
    const offset = Math.max(Number(searchParams.get('offset') ?? '0') || 0, 0)
    const batchParam = searchParams.get('batch') ?? INITIAL_BATCH
    const difficultyParam = searchParams.get('difficultyLevel')
    const contributionParam = searchParams.get('contributionType')
    const filters: IssueFilters = {
        language: searchParams.get('language'),
        difficultyLevel: VALID_DIFFICULTY_LEVELS.has(difficultyParam ?? '') ? difficultyParam as IssueFilters['difficultyLevel'] : null,
        contributionType: VALID_CONTRIBUTION_TYPES.has(contributionParam ?? '') ? contributionParam as IssueFilters['contributionType'] : null,
    }
    const afterCursors = batchParam === INITIAL_BATCH
        ? {}
        : (decodeBatch<Record<string, string | null>>(batchParam) ?? {})

    // 배치별로 캐시 분리 — 같은 언어 조합이라도 batch가 다르면 별도 GitHub 호출
    const getCachedIssues = unstable_cache(
        () => fetchCandidateIssues(profile.topLanguages, auth.accessToken, afterCursors),
        ['github-issues', ...profile.topLanguages.slice().sort(), batchParam],
        { revalidate: GITHUB_API_CACHE_TTL_SECONDS }
    )

    // GitHub 이슈 검색(캐시)과 북마크 키 목록 조회를 병렬 실행 — 서로 의존성 없음
    const [searchResult, bookmarkKeyList] = await Promise.all([
        getCachedIssues(),
        listUserBookmarkKeys(auth.userId),
    ])

    if (searchResult.rateLimited && searchResult.issues.length === 0) {
        return err('GitHub rate limit exceeded', 429, ErrorCode.RATE_LIMITED)
    }

    if (searchResult.failedQueryCount === searchResult.totalQueryCount && searchResult.totalQueryCount > 0) {
        return err('Failed to fetch GitHub issues', 502, ErrorCode.GITHUB_ERROR)
    }

    // 이슈에 포함된 레포 health 점수 조회 — 채점 시 저활성 레포 필터링 기준으로 사용
    const repoNames = [...new Set(searchResult.issues.map((issue) => issue.repository.nameWithOwner))]
    const healthMap = await getRepoHealthMap(repoNames, auth.accessToken)

    // 이슈 채점·정렬 후 북마크 여부 병합
    const bookmarkKeys = new Set(bookmarkKeyList)
    const randomSeed = `${auth.userId}:${batchParam}`
    const rankedIssues = rankIssues(searchResult.issues, profile, healthMap, randomSeed).map((issue) => ({
        ...issue,
        isBookmarked: bookmarkKeys.has(`${issue.repoFullName}#${issue.number}`),
    }))

    // 필터 적용 전 언어 목록 수집 — 필터 적용 여부와 무관하게 사용 가능한 언어 전달
    const availableLanguages = [...new Set(rankedIssues.map((i) => i.language).filter((l): l is string => l !== null))]

    const allIssues = applyFilters(rankedIssues, filters)

    // 현재 배치 캐시 소진 여부 판단 — offset이 캐시 끝에 도달하면 마지막 페이지
    const isLastPage = offset + PAGE_SIZE >= allIssues.length

    // 마지막 페이지이고 GitHub에 다음 페이지가 있으면 언어별 endCursor를 인코딩해 nextBatch로 전달
    // 클라이언트는 이 값을 다음 요청의 batch 파라미터로 사용해 새 GitHub 배치를 요청한다
    const nextBatch = isLastPage && searchResult.hasMoreOnGithub
        ? encodeBatch(searchResult.endCursors)
        : null

    return ok({
        issues: allIssues.slice(offset, offset + PAGE_SIZE),
        total: allIssues.length,
        hasMore: !isLastPage || searchResult.hasMoreOnGithub,
        offset,
        batch: batchParam,
        nextBatch,
        availableLanguages,
        partialResults: searchResult.failedQueryCount > 0,
        failedQueryCount: searchResult.failedQueryCount,
    })
}
