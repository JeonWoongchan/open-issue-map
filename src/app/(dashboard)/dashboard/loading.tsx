import { RecommendationRailSkeleton } from '@/components/dashboard/recommendation/RecommendationRailSkeleton'
import { MainSectionShell } from '@/components/layout/MainSectionShell'
import { RECOMMENDATION_CONDITIONS } from '@/constants/recommendation'

export default function DashboardLoading() {
  return (
    <MainSectionShell
      title="추천 이슈"
      description="관심사와 현재 수준을 기준으로 시작하기 좋은 이슈를 모아봤습니다."
    >
      <div className="flex flex-col gap-8">
        {RECOMMENDATION_CONDITIONS.map((condition) => (
          <RecommendationRailSkeleton key={condition} />
        ))}
      </div>
    </MainSectionShell>
  )
}
