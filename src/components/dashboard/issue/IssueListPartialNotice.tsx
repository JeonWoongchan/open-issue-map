import { NoticeCard } from '@/components/shared/NoticeCard'

type IssueListPartialNoticeProps = {
  failedCount: number
}

export function IssueListPartialNotice({ failedCount }: IssueListPartialNoticeProps) {
  return (
    <NoticeCard tone="warning" icon={null} className="py-4">
      일부 쿼리({failedCount}개)에서 오류가 발생해 결과가 일부만 표시되고 있어요.
    </NoticeCard>
  )
}
