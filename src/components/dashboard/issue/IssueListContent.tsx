import { IssueCard } from './IssueCard'
import type { IssueCardItem } from '@/types/issue'

type IssueListContentProps = {
  issues: IssueCardItem[]
  onToggleBookmark: (issue: IssueCardItem) => Promise<void>
}

export function IssueListContent({
  issues,
  onToggleBookmark,
}: IssueListContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {issues.map((issue) => (
          <IssueCard
            key={issue.url}
            issue={issue}
            onToggleBookmark={onToggleBookmark}
          />
        ))}
      </div>
    </div>
  )
}
