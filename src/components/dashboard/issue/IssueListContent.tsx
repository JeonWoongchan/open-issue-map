import { IssueCard } from './IssueCard'
import type { IssueCardItem } from '@/types/issue'

type IssueListContentProps = {
  issues: IssueCardItem[]
  onToggleBookmark: (issue: IssueCardItem) => Promise<void>
  onAnalyzeClick?: (issue: IssueCardItem) => void
}

export function IssueListContent({
  issues,
  onToggleBookmark,
  onAnalyzeClick,
}: IssueListContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {issues.map((issue) => (
          <IssueCard
            key={issue.url}
            issue={issue}
            onToggleBookmark={onToggleBookmark}
            onAnalyzeClick={onAnalyzeClick}
          />
        ))}
      </div>
    </div>
  )
}
