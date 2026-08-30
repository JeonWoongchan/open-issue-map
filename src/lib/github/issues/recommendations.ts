import { RECOMMENDATION_CONDITION_META, type RecommendationCondition } from '@/constants/recommendation'
import {
  GITHUB_SEARCH_TIMEOUT_MS,
  POPULAR_SORT_WINDOW_DAYS,
  RECOMMENDATION_DISPLAY_LIMIT,
  RECOMMENDATION_FALLBACK_PAGE_SIZE,
  RECOMMENDATION_FETCH_BUDGET_MS,
  RECOMMENDATION_MAX_FETCH_REQUESTS,
  RECOMMENDATION_MAX_PER_REPO,
  RECOMMENDATION_MIN_POOL_SIZE,
  RECOMMENDATION_PAGE_SIZE,
  RECOMMENDATION_SCORE_THRESHOLD,
  RECOMMENDATION_TARGET_POOL_SIZE,
} from '@/constants/scoring-rules'
import { listUserBookmarkKeys } from '@/lib/bookmarks'
import {
  getGitHubErrorLogFields,
  GitHubResourceLimitError,
  GitHubTimeoutError,
} from '@/lib/github/client'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { IssueCardItem, RawIssue, ScoredIssue } from '@/types/issue'
import { getCandidatePoolCount, getCandidatePools, upsertCandidatePool } from './candidate-pool-store'
import { rankIssues } from './ranking'
import { buildRecentWindowQualifier, dedupeIssues, fetchCandidateIssues } from './search'

// 무작위로 count개를 뽑는다(Fisher–Yates) — 원본 배열은 건드리지 않는다.
function sampleRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

// 저장소당 maxPerRepo개까지만 남긴다. 후보가 더 많은 저장소는 그중 무작위로 골라 —
// "새로 추천받기"를 눌렀을 때마다 다른 조합이 나올 여지를 만든다(전체는 이미 점수 기준을 통과한 후보들이라
// 어느 걸 보여줘도 품질 기준은 동일). 원본 순서(GitHub 반환 순서)는 유지하고, 뽑힌 것만 걸러낸다.
export function capIssuesPerRepo(issues: ScoredIssue[], maxPerRepo: number): ScoredIssue[] {
  const byRepo = new Map<string, ScoredIssue[]>()
  for (const issue of issues) {
    const group = byRepo.get(issue.repoFullName)
    if (group) {
      group.push(issue)
    } else {
      byRepo.set(issue.repoFullName, [issue])
    }
  }

  const kept = new Set<ScoredIssue>()
  for (const group of byRepo.values()) {
    const selected = group.length > maxPerRepo ? sampleRandom(group, maxPerRepo) : group
    selected.forEach((issue) => kept.add(issue))
  }

  return issues.filter((issue) => kept.has(issue))
}

// reactions 기준 정렬은 GitHub 검색이 전체 이력을 대상으로 집계해야 해서
// language qualifier만으로는 후보 풀이 너무 커 "Resource limits for this query exceeded"로
// 거부되기 쉽다. 최근 N일로 후보 풀을 좁혀 GitHub이 감당 가능한 비용으로 낮춘다.
// created-desc(최신순)·updated-desc(최근 활동)는 집계가 아니라 단순 시간순 정렬이라 이 제약이 필요 없다.
// 이슈 탐색 페이지(search.ts)와 같은 이유로 같은 창을 쓰므로 POPULAR_SORT_WINDOW_DAYS를 공유한다.
const RECENT_WINDOW_DAYS: Partial<Record<RecommendationCondition, number>> = {
  popular: POPULAR_SORT_WINDOW_DAYS,
}

// '인기' 조건은 reactions 수만으로 정렬하므로, 스타 1개짜리 신생 저장소 이슈도 우연히 반응이
// 몰리면 섞여 들어올 수 있다. 이 조건에만 최소 스타 수를 요구해 걸러낸다.
//
// GitHub search 쿼리에 stars:>=N qualifier를 넣어봤지만 효과가 없었다(minStars=0인 결과가 그대로 섞여 나옴) —
// 코드/저장소 검색과 달리 이슈 검색 인덱스는 부모 저장소의 스타 수를 필터링 가능한 필드로 지원하지 않는 것으로 보인다.
// 그래서 쿼리로 거르는 대신, 이미 응답에 포함된 repository.stargazerCount 값으로 후처리 필터링한다.
const POPULAR_MIN_STARS = 30
const DEGRADED_MIN_STORED_COUNT: Record<RecommendationCondition, number> = {
  latest: RECOMMENDATION_MIN_POOL_SIZE,
  popular: 50,
}
const DEGRADED_MIN_PREVIOUS_RATIO = 0.25

function filterByMinStars(issues: RawIssue[], minStars: number): RawIssue[] {
  return issues.filter((issue) => issue.repository.stargazerCount >= minStars)
}

type CandidatePoolStopReason =
  | 'target_reached'
  | 'github_exhausted'
  | 'resource_limit'
  | 'timeout'
  | 'request_limit'

// 목표 300개까지 커서를 순차로 이어 붙인다. resource limit이 난 페이지에서만 100→50으로 낮추고,
// 이미 성공한 페이지는 버리지 않는다. 실패/시간 소진 시 150개 이상이면 부분 결과를 사용한다.
async function fetchCandidatePool(
  language: string,
  condition: RecommendationCondition,
  accessToken: string,
  sort: string,
  extraQualifiers: string,
): Promise<{
  issues: RawIssue[]
  rawFetchedCount: number
  requestCount: number
  pageSize: number
  degraded: boolean
  stopReason: CandidatePoolStopReason
}> {
  const pool: RawIssue[] = []
  let dedupedPool: RawIssue[] = []
  let cursor: string | null = null
  let requestCount = 0
  let successfulPageCount = 0
  let pageSize = RECOMMENDATION_PAGE_SIZE
  const deadlineAt = Date.now() + RECOMMENDATION_FETCH_BUDGET_MS

  const hasMinimumPool = () => dedupedPool.length >= RECOMMENDATION_MIN_POOL_SIZE

  const buildResult = (stopReason: CandidatePoolStopReason) => ({
    issues: dedupedPool,
    rawFetchedCount: pool.length,
    requestCount,
    pageSize,
    degraded: stopReason === 'resource_limit' || stopReason === 'timeout' || stopReason === 'request_limit',
    stopReason,
  })

  while (dedupedPool.length < RECOMMENDATION_TARGET_POOL_SIZE) {
    const remainingMs = deadlineAt - Date.now()
    if (remainingMs <= 0) {
      if (hasMinimumPool()) {
        return buildResult('timeout')
      }
      throw new GitHubTimeoutError()
    }

    if (requestCount >= RECOMMENDATION_MAX_FETCH_REQUESTS) {
      if (hasMinimumPool()) {
        return buildResult('request_limit')
      }
      throw new Error('Recommendation candidate pool did not reach its minimum size')
    }

    const startedAt = Date.now()
    const requestedSize = Math.min(pageSize, RECOMMENDATION_TARGET_POOL_SIZE - dedupedPool.length)
    requestCount++
    let result
    try {
      result = await fetchCandidateIssues(
        [language],
        accessToken,
        cursor,
        requestedSize,
        sort,
        extraQualifiers,
        Math.min(GITHUB_SEARCH_TIMEOUT_MS, remainingMs),
      )
    } catch (error) {
      const shouldFallback = error instanceof GitHubResourceLimitError
        && pageSize > RECOMMENDATION_FALLBACK_PAGE_SIZE

      console.error(JSON.stringify({
        event: 'recommendation_pool_page',
        status: 'failed',
        phase: 'fetch',
        condition,
        language,
        sort,
        page: successfulPageCount + 1,
        attempt: requestCount,
        first: requestedSize,
        cursorPresent: cursor !== null,
        accumulatedRawCount: pool.length,
        willRetry: shouldFallback,
        nextFirst: shouldFallback ? RECOMMENDATION_FALLBACK_PAGE_SIZE : undefined,
        durationMs: Date.now() - startedAt,
        ...getGitHubErrorLogFields(error),
      }))

      if (shouldFallback) {
        pageSize = RECOMMENDATION_FALLBACK_PAGE_SIZE
        continue
      }

      if (
        (error instanceof GitHubResourceLimitError || error instanceof GitHubTimeoutError)
        && hasMinimumPool()
      ) {
        return buildResult(error instanceof GitHubResourceLimitError ? 'resource_limit' : 'timeout')
      }

      throw error
    }

    pool.push(...result.issues)
    dedupedPool = dedupeIssues(pool)
    successfulPageCount++
    console.info(JSON.stringify({
      event: 'recommendation_pool_page',
      status: 'succeeded',
      phase: 'fetch',
      condition,
      language,
      sort,
      page: successfulPageCount,
      attempt: requestCount,
      first: requestedSize,
      cursorPresent: cursor !== null,
      returnedCount: result.issues.length,
      accumulatedRawCount: pool.length,
      accumulatedDedupedCount: dedupedPool.length,
      hasNextPage: result.hasMoreOnGithub,
      rateLimit: result.rateLimit,
      durationMs: Date.now() - startedAt,
    }))

    if (!result.hasMoreOnGithub || !result.endCursor) {
      return buildResult('github_exhausted')
    }
    cursor = result.endCursor
  }

  return buildResult('target_reached')
}

export type CandidatePoolRefreshResult = {
  refreshStatus: 'stored' | 'preserved'
  fetchedCount: number
  candidateCount: number
  storedCount: number
  previousCount: number | null
  requestCount: number
  degraded: boolean
  stopReason: CandidatePoolStopReason
  preservationReason?: 'empty_result' | 'below_condition_minimum' | 'large_drop'
}

// 스케줄러 전용 — 언어 하나 + 조건 하나의 후보 풀을 GitHub에서 새로 가져와 DB에 통째로 교체 저장한다.
// 요청 경로(대시보드 렌더링)는 이 함수를 절대 호출하지 않는다 — GitHub 호출은 이 함수를 통해서만,
// 크론이 정한 주기에만 일어난다.
export async function refreshCandidatePool(
  language: string,
  condition: RecommendationCondition,
  accessToken: string,
): Promise<CandidatePoolRefreshResult> {
  const startedAt = Date.now()
  const { sort } = RECOMMENDATION_CONDITION_META[condition]
  const windowDays = RECENT_WINDOW_DAYS[condition]
  const extraQualifiers = windowDays ? buildRecentWindowQualifier(windowDays) : ''

  const result = await fetchCandidatePool(language, condition, accessToken, sort, extraQualifiers)
  const issues = condition === 'popular'
    ? filterByMinStars(result.issues, POPULAR_MIN_STARS)
    : result.issues
  const previousCount = await getCandidatePoolCount(language, condition)

  let preservationReason: CandidatePoolRefreshResult['preservationReason']
  if (issues.length === 0) {
    preservationReason = 'empty_result'
  } else if (result.degraded && issues.length < DEGRADED_MIN_STORED_COUNT[condition]) {
    preservationReason = 'below_condition_minimum'
  } else if (
    result.degraded
    && previousCount !== null
    && previousCount > 0
    && issues.length < Math.ceil(previousCount * DEGRADED_MIN_PREVIOUS_RATIO)
  ) {
    preservationReason = 'large_drop'
  }

  if (preservationReason) {
    console.warn(JSON.stringify({
      event: 'recommendation_pool_refresh',
      status: 'preserved',
      condition,
      language,
      sort,
      windowDays,
      rawFetchedCount: result.rawFetchedCount,
      dedupedCount: result.issues.length,
      candidateCount: issues.length,
      previousCount,
      requestCount: result.requestCount,
      pageSize: result.pageSize,
      degraded: result.degraded,
      stopReason: result.stopReason,
      preservationReason,
      durationMs: Date.now() - startedAt,
    }))

    return {
      refreshStatus: 'preserved',
      fetchedCount: result.rawFetchedCount,
      candidateCount: issues.length,
      storedCount: previousCount ?? 0,
      previousCount,
      requestCount: result.requestCount,
      degraded: result.degraded,
      stopReason: result.stopReason,
      preservationReason,
    }
  }

  try {
    await upsertCandidatePool(language, condition, issues)
  } catch (error) {
    console.error(JSON.stringify({
      event: 'recommendation_pool_refresh',
      status: 'failed',
      phase: 'persist',
      condition,
      language,
      sort,
      rawFetchedCount: result.rawFetchedCount,
      dedupedCount: result.issues.length,
      storedCount: issues.length,
      previousCount,
      requestCount: result.requestCount,
      pageSize: result.pageSize,
      degraded: result.degraded,
      stopReason: result.stopReason,
      durationMs: Date.now() - startedAt,
      errorKind: 'internal',
    }))
    throw error
  }

  console.info(JSON.stringify({
    event: 'recommendation_pool_refresh',
    status: 'succeeded',
    condition,
    language,
    sort,
    windowDays,
    rawFetchedCount: result.rawFetchedCount,
    dedupedCount: result.issues.length,
    storedCount: issues.length,
    requestCount: result.requestCount,
    pageSize: result.pageSize,
    degraded: result.degraded,
    stopReason: result.stopReason,
    durationMs: Date.now() - startedAt,
  }))

  return {
    refreshStatus: 'stored',
    fetchedCount: result.rawFetchedCount,
    candidateCount: issues.length,
    storedCount: issues.length,
    previousCount,
    requestCount: result.requestCount,
    degraded: result.degraded,
    stopReason: result.stopReason,
  }
}

// 추천 이슈 페이지 전용 조회 — GitHub를 직접 부르지 않는다. 스케줄러(refreshCandidatePool)가
// 미리 언어별로 적재해둔 후보 풀을 DB에서 읽어와, 이 요청의 프로필 기준으로 그 자리에서
// 개인화(랭킹/저장소당 캡/샘플링)만 한다. 네트워크 I/O가 DB 조회뿐이라 항상 빠르고, 그래서
// "새로 추천받기"도 별도 캐시 무효화 없이 이 함수를 한 번 더 부르는 것으로 충분하다 —
// capIssuesPerRepo/sampleRandom의 무작위성 덕에 호출할 때마다 자연히 다른 조합이 나온다.
export async function fetchRecommendedIssues(
  condition: RecommendationCondition,
  profile: OnboardingProfile,
): Promise<ScoredIssue[]> {
  const pools = await getCandidatePools(profile.topLanguages, condition)
  const pool = dedupeIssues(pools.flat())

  const rankedIssues = rankIssues(pool, profile, RECOMMENDATION_SCORE_THRESHOLD)
  const cappedIssues = capIssuesPerRepo(rankedIssues, RECOMMENDATION_MAX_PER_REPO)
  // 저장소당 캡을 다 통과해도 후보가 DISPLAY_LIMIT보다 많으면 다시 무작위로 추려낸다 —
  return sampleRandom(cappedIssues, RECOMMENDATION_DISPLAY_LIMIT)
}

// ScoredIssue[]에 북마크 여부를 합쳐 카드 렌더링용 IssueCardItem[]으로 변환한다.
function mergeBookmarkStatus(scoredIssues: ScoredIssue[], bookmarkKeys: string[]): IssueCardItem[] {
  const bookmarkKeySet = new Set(bookmarkKeys)
  return scoredIssues.map((issue) => ({
    ...issue,
    isBookmarked: bookmarkKeySet.has(`${issue.repoFullName}#${issue.number}`),
  }))
}

export type RecommendationRailData = { issues: IssueCardItem[]; fetchFailed: boolean }

// 대시보드 최초 렌더(RecommendationRail)와 "새로 추천받기"(refreshRecommendations)가
// 공유하는 조회 파이프라인 — 이슈 조회 + 북마크 병합 + 실패 격리를 한 곳에서만 구현한다.
export async function loadRecommendationRailData(
  condition: RecommendationCondition,
  profile: OnboardingProfile,
  userId: string | null,
): Promise<RecommendationRailData> {
  try {
    const [scoredIssues, bookmarkKeys] = await Promise.all([
      fetchRecommendedIssues(condition, profile),
      userId ? listUserBookmarkKeys(userId) : Promise.resolve([]),
    ])

    return { issues: mergeBookmarkStatus(scoredIssues, bookmarkKeys), fetchFailed: false }
  } catch (error) {
    console.error(`[loadRecommendationRailData] ${condition} 조회 실패:`, error)
    return { issues: [], fetchFailed: true }
  }
}
