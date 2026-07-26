import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardHelpDialogWrapper } from '@/components/dashboard/dashboard-help/DashboardHelpDialogWrapper'
import { DashboardWorkspace } from '@/components/dashboard/DashboardWorkspace'
import { MainSectionShell } from '@/components/layout/MainSectionShell'
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
            actions={session ? <Link href="/onboarding">온보딩 다시하기</Link> : null}
        >
            <DashboardWorkspace
                isGuest={!session}
                helpSlot={<DashboardHelpDialogWrapper />}
                profile={profile}
                insight={insight}
            />
        </MainSectionShell>
    )
}
