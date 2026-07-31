import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DashboardHelpDialogWrapper } from '@/components/dashboard/dashboard-help/DashboardHelpDialogWrapper'
import { DashboardReportCard } from '@/components/dashboard/DashboardReportCard'
import { GuestInsightBanner } from '@/components/dashboard/GuestInsightBanner'
import { RecommendationRail } from '@/components/dashboard/recommendation/RecommendationRail'
import { RecommendationRailSkeleton } from '@/components/dashboard/recommendation/RecommendationRailSkeleton'
import { MainSectionShell } from '@/components/layout/MainSectionShell'
import { GUEST_ONBOARDING_PROFILE } from '@/constants/guest-profile'
import { RECOMMENDATION_CONDITIONS } from '@/constants/recommendation'
import { auth } from '@/lib/auth'
import { createPageMetadata } from '@/lib/metadata'
import { pickRandom } from '@/lib/utils'
import { loadOnboardingProfile } from '@/lib/user/profile'
import { getOnboardingAdvice } from '@/lib/user/onboarding-advice'

export const metadata: Metadata = createPageMetadata({
    title: '추천 이슈',
    description: '관심사와 현재 수준을 기준으로 오픈소스 첫 기여에 적합한 GitHub 이슈를 살펴봅니다.',
    canonicalPath: '/dashboard',
})

export default async function DashboardPage() {
    const session = await auth()
    const profile = session ? await loadOnboardingProfile(session.user.id) : null
    // 다중 선택된 기여방식 중 어떤 값으로 조언을 조회할지는 이 화면의 결정이라 여기서 무작위로 고른다 —
    // getOnboardingAdvice는 (기여방식, 목적) 조합을 그대로 조회하는 순수 함수로 남겨둔다.
    const adviceItems =
        profile && profile.contributionTypes.length > 0 && profile.purpose
            ? await getOnboardingAdvice(pickRandom(profile.contributionTypes), profile.purpose)
            : null

    return (
        <MainSectionShell
            title="추천 이슈"
            description="관심사와 현재 수준을 기준으로 시작하기 좋은 이슈를 모아봤습니다."
        >
            {profile && adviceItems ? (
                <DashboardReportCard profile={profile} adviceItems={adviceItems} />
            ) : session ? null : (
                <GuestInsightBanner />
            )}
            <div className="flex flex-col gap-8">
                {RECOMMENDATION_CONDITIONS.map((condition) => (
                    <Suspense key={condition} fallback={<RecommendationRailSkeleton />}>
                        <RecommendationRail
                            condition={condition}
                            profile={profile ?? GUEST_ONBOARDING_PROFILE}
                            userId={session?.user.id ?? null}
                            isGuest={!session}
                        />
                    </Suspense>
                ))}
            </div>
            <DashboardHelpDialogWrapper />
        </MainSectionShell>
    )
}
