import { CardListSkeleton } from '@/components/shared/CardListSkeleton'
import { MainSectionShell } from '@/components/layout/MainSectionShell'

export default function IssuesLoading() {
  return (
    <MainSectionShell
      title="이슈 탐색"
      description="언어·난이도·기여 방식으로 조건을 좁혀 원하는 이슈를 직접 찾아보세요."
    >
      <CardListSkeleton count={8} />
    </MainSectionShell>
  )
}
