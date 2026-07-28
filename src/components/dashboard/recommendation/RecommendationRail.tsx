import type { RecommendationCondition } from '@/constants/recommendation'
import { loadRecommendationRailData } from '@/lib/github/issues/recommendations'
import type { OnboardingProfile } from '@/lib/user/profile'
import { RecommendationRailShell } from './RecommendationRailShell'

type RecommendationRailProps = {
  condition: RecommendationCondition
  profile: OnboardingProfile
  userId: string | null
  isGuest: boolean
}

export async function RecommendationRail({ condition, profile, userId, isGuest }: RecommendationRailProps) {
  const initialData = await loadRecommendationRailData(condition, profile, userId)

  return <RecommendationRailShell condition={condition} isGuest={isGuest} initialData={initialData} />
}
