'use server'

import { GUEST_ONBOARDING_PROFILE } from '@/constants/guest-profile'
import type { RecommendationCondition } from '@/constants/recommendation'
import { auth } from '@/lib/auth'
import { loadRecommendationRailData, type RecommendationRailData } from '@/lib/github/issues/recommendations'
import { loadOnboardingProfile } from '@/lib/user/profile'

// 레일별 새로고침 버튼용 — fetchRecommendedIssues가 이제 DB 후보 풀만 읽는 빠른 연산이라
// 캐시 무효화 개념이 없다. 이 액션은 그 파이프라인을 한 번 더 돌려서 결과를 클라이언트에
// 직접 반환하기만 하면 된다(랭킹/저장소당 캡/샘플링의 무작위성 덕에 자연히 다른 조합이 나온다).
// 클라이언트가 준 값을 믿지 않고 서버에서 직접 세션·프로필을 구한다(page.tsx와 동일한 방식).
export async function refreshRecommendations(condition: RecommendationCondition): Promise<RecommendationRailData> {
  const session = await auth()
  const userId = session?.user.id ?? null
  const profile = userId ? await loadOnboardingProfile(userId) : null

  return loadRecommendationRailData(condition, profile ?? GUEST_ONBOARDING_PROFILE, userId)
}
