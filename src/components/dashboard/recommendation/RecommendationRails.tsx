import { Suspense } from 'react'
import { RECOMMENDATION_CONDITIONS } from '@/constants/recommendation'
import type { OnboardingProfile } from '@/lib/user/profile'
import { RecommendationRail } from './RecommendationRail'
import { RecommendationRailSkeleton } from './RecommendationRailSkeleton'
import { RecommendationRefreshButton } from './RecommendationRefreshButton'

type RecommendationRailsProps = {
  profile: OnboardingProfile
  accessToken: string | null
  userId: string | null
  isGuest: boolean
}

export function RecommendationRails({ profile, accessToken, userId, isGuest }: RecommendationRailsProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          조건 3가지로 매번 새로 조회해서 보여드려요. 목록은 저장해두지 않으니 새로고침해도 다시 조회해요.
        </p>
        <RecommendationRefreshButton />
      </div>

      {accessToken ? (
        RECOMMENDATION_CONDITIONS.map((condition) => (
          <Suspense key={condition} fallback={<RecommendationRailSkeleton />}>
            <RecommendationRail
              condition={condition}
              profile={profile}
              accessToken={accessToken}
              userId={userId}
              isGuest={isGuest}
            />
          </Suspense>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">GitHub 연동에 문제가 있어 추천 이슈를 불러오지 못했어요.</p>
      )}
    </div>
  )
}
