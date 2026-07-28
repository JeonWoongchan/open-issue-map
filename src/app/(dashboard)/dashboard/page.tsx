import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DashboardReportCard } from '@/components/dashboard/DashboardReportCard'
import { RecommendationRail } from '@/components/dashboard/recommendation/RecommendationRail'
import { RecommendationRailSkeleton } from '@/components/dashboard/recommendation/RecommendationRailSkeleton'
import { MainSectionShell } from '@/components/layout/MainSectionShell'
import { GUEST_ONBOARDING_PROFILE } from '@/constants/guest-profile'
import { RECOMMENDATION_CONDITIONS } from '@/constants/recommendation'
import { auth } from '@/lib/auth'
import { createPageMetadata } from '@/lib/metadata'
import { loadOnboardingProfile } from '@/lib/user/profile'
import { loadOrRetryOnboardingInsight } from '@/lib/user/onboarding-insight'

export const metadata: Metadata = createPageMetadata({
    title: '추천 이슈',
    description: '관심사와 현재 수준을 기준으로 오픈소스 첫 기여에 적합한 GitHub 이슈를 살펴봅니다.',
    canonicalPath: '/dashboard',
})

export default async function DashboardPage() {
    const session = await auth()
    // profile은 await하지 않고 넘긴다 — insight 조회가 success/no-row로 끝나는 대부분의 경우
    // profile이 아예 필요 없어서, 두 조회가 동시에 진행되고 재시도가 필요할 때만 profile을 기다린다.
    const profilePromise = session ? loadOnboardingProfile(session.user.id) : Promise.resolve(null)
    const insight = session ? await loadOrRetryOnboardingInsight(session.user.id, profilePromise) : null
    const profile = await profilePromise

    return (
        <MainSectionShell
            title="추천 이슈"
            description="관심사와 현재 수준을 기준으로 시작하기 좋은 이슈를 모아봤습니다."
        >
            {profile && insight ? <DashboardReportCard profile={profile} insight={insight} /> : null}
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
        </MainSectionShell>
    )
}
