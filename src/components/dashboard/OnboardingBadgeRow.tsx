import { Badge } from '@/components/ui/badge'
import {
  getContributionTypeLabel,
  getExperienceLevelLabel,
  getPurposeLabel,
  getWeeklyHoursLabel,
} from '@/components/mypage/my-page-labels'
import type { OnboardingProfile } from '@/lib/user/profile'

type OnboardingBadgeRowProps = {
  profile: OnboardingProfile
}

// DashboardReportCard(로그인)와 GuestInsightBanner(비로그인)가 공유하는 배지 행
export function OnboardingBadgeRow({ profile }: OnboardingBadgeRowProps) {
  const experienceLabel = getExperienceLevelLabel(profile.experienceLevel)
  const secondaryLabels = [
    ...profile.topLanguages,
    ...profile.contributionTypes.map(getContributionTypeLabel),
    getWeeklyHoursLabel(profile.weeklyHours),
    getPurposeLabel(profile.purpose),
  ].filter((label): label is string => Boolean(label))

  return (
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
  )
}
