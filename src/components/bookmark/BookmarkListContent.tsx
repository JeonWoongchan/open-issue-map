import { IssueCard } from '@/components/dashboard/issue/IssueCard'
import type { IssueCardItem } from '@/types/issue'

type BookmarkListContentProps = {
  issues: IssueCardItem[]
  onToggleBookmark: (issue: IssueCardItem) => Promise<void>
}

export function BookmarkListContent({
  issues,
  onToggleBookmark,
}: BookmarkListContentProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {issues.map((issue) => (
        <IssueCard
          key={issue.url}
          issue={issue}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  )
}
