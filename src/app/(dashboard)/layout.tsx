import type { ReactNode } from 'react'
import { MainHeader } from '@/components/layout/MainHeader'
import { PageContainer } from '@/components/layout/PageContainer'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    const session = await auth()

    // 로그인 상태에서 온보딩 미완료면 온보딩으로 — 게스트는 그대로 통과
    if (session && !session.user.isOnboarded) redirect('/onboarding')

    return (
        <div className="min-h-screen bg-dashboard-banner">
            <MainHeader
                image={session?.user.image}
                name={session?.user.name}
                isGuest={!session}
            />
            <PageContainer>{children}</PageContainer>
        </div>
    )
}
