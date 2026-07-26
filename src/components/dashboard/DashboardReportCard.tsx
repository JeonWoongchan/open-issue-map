import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getContributionTypeLabel,
  getExperienceLevelLabel,
  getPurposeLabel,
  getWeeklyHoursLabel,
} from '@/components/mypage/my-page-labels'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { OnboardingInsight } from '@/types/onboarding-insight'

type DashboardReportCardProps = {
  profile: OnboardingProfile
  insight: OnboardingInsight
}

export function DashboardReportCard({ profile, insight }: DashboardReportCardProps) {
  const experienceLabel = getExperienceLevelLabel(profile.experienceLevel)
  // 경험 수준만 액센트 칩으로 강조하고, 나머지는 같은 스타일로 나열한다.
  const secondaryLabels = [
    ...profile.topLanguages,
    ...profile.contributionTypes.map(getContributionTypeLabel),
    getWeeklyHoursLabel(profile.weeklyHours),
    getPurposeLabel(profile.purpose),
  ].filter((label): label is string => Boolean(label))

  const adviceItems = insight.status === 'success' ? insight.adviceItems : null
  // 페이지가 매 요청마다 새로 렌더되는 걸 이용해, 새로고침할 때마다 다른 조언이 보이도록
  // 서버에서 매번 무작위로 하나만 고른다(클라이언트 상태·재요청 없이 구현).
  const advice = adviceItems && adviceItems.length > 0 ? adviceItems[Math.floor(Math.random() * adviceItems.length)] : null

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-report-card px-5 py-4 sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-wrap gap-2">
          {experienceLabel ? (
            <Badge
              variant="outline"
              size="lg"
              className="rounded-full border-brand-subtle-border bg-brand-subtle font-semibold text-brand-subtle-foreground"
            >
              {experienceLabel}
            </Badge>
          ) : null}
          {secondaryLabels.map((label) => (
            <Badge key={label} variant="outline" size="lg" className="rounded-full bg-card text-muted-foreground">
              {label}
            </Badge>
          ))}
        </div>

        {advice ? (
          <div className="flex items-start gap-1.5">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-interactive-action" />
            <p className="text-sm leading-relaxed text-foreground">{advice}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">AI 분석 결과를 불러오지 못했습니다.</p>
        )}
      </div>
    </div>
  )
}
