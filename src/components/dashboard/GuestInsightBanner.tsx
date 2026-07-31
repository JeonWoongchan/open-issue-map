import { SignInButton } from '@/components/shared/SignInButton'
import { GUEST_ONBOARDING_PROFILE } from '@/constants/guest-profile'
import { signInWithGitHub } from '@/lib/auth-actions'
import { OnboardingBadgeRow } from './OnboardingBadgeRow'

export function GuestInsightBanner() {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-report-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <OnboardingBadgeRow profile={GUEST_ONBOARDING_PROFILE} />
        <p className="text-sm leading-relaxed text-foreground">
          로그인하지 않아 임의로 설정된 기본 조건으로 추천 중이에요. 로그인하면 내 온보딩 답변에 맞는 추천을 받을 수 있어요.
        </p>
      </div>
      <form action={signInWithGitHub} className="shrink-0">
        <SignInButton size="sm" variant="outline" className="w-full sm:w-fit" />
      </form>
    </div>
  )
}
