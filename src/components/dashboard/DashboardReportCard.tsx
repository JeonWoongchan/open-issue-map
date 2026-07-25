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

  return (
    <div className="rounded-2xl border border-border bg-report-card p-5">
      <div className="flex flex-wrap gap-2 border-b border-dashed border-border pb-4">
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

      <div className="pt-4">
        <div className="mb-2.5 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-interactive-action" />
          <span className="text-xs font-semibold text-interactive-action">이 조합을 위한 분석</span>
        </div>
        {insight.status === 'success' && insight.adviceItems ? (
          <ul className="flex flex-col gap-2">
            {insight.adviceItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-foreground">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-interactive-action" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">AI 분석 결과를 불러오지 못했습니다.</p>
        )}
      </div>
    </div>
  )
}
