import { IssueCard } from '@/components/dashboard/issue/IssueCard'
import { CardSkeletonItem } from '@/components/shared/CardListSkeleton'
import type { IssueCardItem } from '@/types/issue'

type BookmarkListContentProps = {
  issues: IssueCardItem[]
  onToggleBookmark: (issue: IssueCardItem) => Promise<void>

  trailingSkeletonCount?: number
}

export function BookmarkListContent({
  issues,
  onToggleBookmark,
  trailingSkeletonCount = 0,
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
      {Array.from({ length: trailingSkeletonCount }).map((_, index) => (
        <CardSkeletonItem key={`trailing-skeleton-${index}`} />
      ))}
    </div>
  )
}
