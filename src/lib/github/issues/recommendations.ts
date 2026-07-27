import { RECOMMENDATION_CONDITION_META, type RecommendationCondition } from '@/constants/recommendation'
import {
  RECOMMENDATION_DISPLAY_LIMIT,
  RECOMMENDATION_MAX_PER_REPO,
  RECOMMENDATION_PAGE_COUNT,
  RECOMMENDATION_PAGE_SIZE,
  RECOMMENDATION_SCORE_THRESHOLD,
} from '@/constants/scoring-rules'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { RawIssue, ScoredIssue } from '@/types/issue'
import { rankIssues } from './ranking'
import { dedupeIssues, fetchCandidateIssues } from './search'

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
const RECENT_WINDOW_DAYS: Partial<Record<RecommendationCondition, number>> = {
  popular: 90,
}

function buildRecentWindowQualifier(days: number): string {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return `created:>=${sinceDate.toISOString().slice(0, 10)}`
}

// '인기' 조건은 reactions 수만으로 정렬하므로, 스타 1개짜리 신생 저장소 이슈도 우연히 반응이
// 몰리면 섞여 들어올 수 있다. 이 조건에만 최소 스타 수를 요구해 걸러낸다.
//
// GitHub search 쿼리에 stars:>=N qualifier를 넣어봤지만 효과가 없었다(minStars=0인 결과가 그대로 섞여 나옴) —
// 코드/저장소 검색과 달리 이슈 검색 인덱스는 부모 저장소의 스타 수를 필터링 가능한 필드로 지원하지 않는 것으로 보인다.
// 그래서 쿼리로 거르는 대신, 이미 응답에 포함된 repository.stargazerCount 값으로 후처리 필터링한다.
const POPULAR_MIN_STARS = 30

function filterByMinStars(issues: RawIssue[], minStars: number): RawIssue[] {
  return issues.filter((issue) => issue.repository.stargazerCount >= minStars)
}

// 조건 1개당 GitHub 검색 결과를 최대 RECOMMENDATION_PAGE_COUNT페이지까지 순차로 이어 붙인다.
// 커서 페이지네이션이라 병렬화가 안 되고, GitHub이 더 줄 게 없으면(hasMoreOnGithub=false) 그 전에 멈춘다.
async function fetchCandidatePool(
  languages: string[],
  accessToken: string,
  sort: string,
  extraQualifiers: string,
): Promise<RawIssue[]> {
  const pool: RawIssue[] = []
  let cursor: string | null = null

  for (let page = 0; page < RECOMMENDATION_PAGE_COUNT; page++) {
    const result = await fetchCandidateIssues(languages, accessToken, cursor, RECOMMENDATION_PAGE_SIZE, sort, extraQualifiers)
    pool.push(...result.issues)

    if (!result.hasMoreOnGithub || !result.endCursor) break
    cursor = result.endCursor
  }

  return dedupeIssues(pool)
}

// 추천 이슈 캐시를 레일(조건) 단위로 무효화하기 위한 태그 — 레일별 새로고침 버튼이
// 다른 레일까지 같이 무효화하지 않도록 condition을 키에 포함한다.
// RecommendationRail의 unstable_cache와 "새로 추천받기" Server Action(revalidateTag)이
// 같은 문자열을 써야 하므로 여기 한 곳에서만 만든다.
export function buildRecommendationCacheTag(cacheUserId: string, condition: RecommendationCondition): string {
  return `recommendations:${cacheUserId}:${condition}`
}

// 추천 이슈 페이지 전용 조회 — 이 함수 자체는 캐시를 모르는 순수 함수다.
// 새로고침해도 결과가 유지되도록 하는 캐싱(unstable_cache)은 호출부인 RecommendationRail.tsx가 담당한다.
export async function fetchRecommendedIssues(
  condition: RecommendationCondition,
  profile: OnboardingProfile,
  accessToken: string,
): Promise<ScoredIssue[]> {
  const { sort } = RECOMMENDATION_CONDITION_META[condition]
  const windowDays = RECENT_WINDOW_DAYS[condition]
  const extraQualifiers = windowDays ? buildRecentWindowQualifier(windowDays) : ''

  const pool = await fetchCandidatePool(profile.topLanguages, accessToken, sort, extraQualifiers)
  const issues = condition === 'popular' ? filterByMinStars(pool, POPULAR_MIN_STARS) : pool

  const rankedIssues = rankIssues(issues, profile, RECOMMENDATION_SCORE_THRESHOLD)
  const cappedIssues = capIssuesPerRepo(rankedIssues, RECOMMENDATION_MAX_PER_REPO)
  // 저장소당 캡을 다 통과해도 후보가 DISPLAY_LIMIT보다 많으면 다시 무작위로 추려낸다 —
  return sampleRandom(cappedIssues, RECOMMENDATION_DISPLAY_LIMIT)
}
