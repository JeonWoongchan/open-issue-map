import { RECOMMENDATION_CONDITION_META, type RecommendationCondition } from '@/constants/recommendation'
import { RECOMMENDATION_FETCH_SIZE, RECOMMENDATION_SCORE_THRESHOLD } from '@/constants/scoring-rules'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { ScoredIssue } from '@/types/issue'
import { rankIssues } from './ranking'
import { fetchCandidateIssues } from './search'

// 추천 이슈 페이지 전용 조회 — 캐싱 없이 매번 라이브로 조건당 표본을 가져와 채점하고,
// 탐색 목록보다 훨씬 엄격한 임계값(RECOMMENDATION_SCORE_THRESHOLD)만 남긴다.
// 페이지네이션이 없어 fetchIssueListPage(service.ts)의 캐시/singleflight/커서 로직이 필요 없다.
export async function fetchRecommendedIssues(
  condition: RecommendationCondition,
  profile: OnboardingProfile,
  accessToken: string,
): Promise<ScoredIssue[]> {
  const { sort } = RECOMMENDATION_CONDITION_META[condition]

  const { issues } = await fetchCandidateIssues(
    profile.topLanguages,
    accessToken,
    null,
    RECOMMENDATION_FETCH_SIZE,
    sort,
  )

  return rankIssues(issues, profile, RECOMMENDATION_SCORE_THRESHOLD)
}
