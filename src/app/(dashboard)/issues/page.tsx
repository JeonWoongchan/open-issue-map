import type { Metadata } from 'next'
import { DashboardHelpDialogWrapper } from '@/components/dashboard/dashboard-help/DashboardHelpDialogWrapper'
import { IssueExploreWorkspace } from '@/components/dashboard/issue/IssueExploreWorkspace'
import { MainSectionShell } from '@/components/layout/MainSectionShell'
import { auth } from '@/lib/auth'
import { createPageMetadata } from '@/lib/metadata'

export const metadata: Metadata = createPageMetadata({
    title: '이슈 탐색',
    description: '언어, 난이도, 기여 방식 등 조건으로 GitHub 이슈를 검색하고 필터링합니다.',
    canonicalPath: '/issues',
})

export default async function IssuesPage() {
    const session = await auth()

    return (
        <MainSectionShell
            title="이슈 탐색"
            description="언어·난이도·기여 방식으로 조건을 좁혀 원하는 이슈를 직접 찾아보세요."
        >
            <IssueExploreWorkspace isGuest={!session} helpSlot={<DashboardHelpDialogWrapper />} />
        </MainSectionShell>
    )
}
