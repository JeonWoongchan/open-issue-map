import Link from 'next/link'
import { DashboardHelpDialog } from '@/components/dashboard/dashboard-help/DashboardHelpDialog'
import { IssueList } from '@/components/dashboard/issue/IssueList'
import { MainSectionShell } from '@/components/layout/MainSectionShell'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <MainSectionShell
      title="추천 이슈"
      description="관심사와 현재 수준을 기준으로 시작하기 좋은 이슈를 모아봤습니다."
      actions={
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-fit border-interactive-selected-border text-interactive-action-hover hover:bg-interactive-hover"
        >
          <Link href="/onboarding">추천 설정 다시하기</Link>
        </Button>
      }
      topAside={<DashboardHelpDialog />}
    >
      <IssueList />
    </MainSectionShell>
  )
}
