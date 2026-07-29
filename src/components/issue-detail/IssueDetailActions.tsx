import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { IssueCardItem } from '@/types/issue'
import { IssueDetailBookmarkButton } from './IssueDetailBookmarkButton'

type IssueDetailActionsProps = {
  issue: IssueCardItem
  isGuest: boolean
}

// 헤더의 점수 링 옆에 있던 북마크 버튼을 여기로 옮기고, AI 가이드 버튼이 있던 사이드바 자리는
// GitHub 이슈로 바로 이동하는 버튼으로 교체한다 — AI 가이드는 본문(왼쪽) 섹션으로 옮겨졌다.
export function IssueDetailActions({ issue, isGuest }: IssueDetailActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="interactive" size="sm" className="flex-1">
        <a href={issue.url} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
          GitHub에서 이슈 보기
        </a>
      </Button>
      <IssueDetailBookmarkButton issue={issue} isGuest={isGuest} />
    </div>
  )
}
