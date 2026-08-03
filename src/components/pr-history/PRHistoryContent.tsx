// PR 카드 그리드 렌더링

import { CardSkeletonItem } from '@/components/shared/CardListSkeleton'
import type { PullRequestItem } from '@/types/pull-request'
import { PRCard } from './PRCard'

type PRHistoryContentProps = {
  items: PullRequestItem[]
  trailingSkeletonCount?: number
}

export function PRHistoryContent({ items, trailingSkeletonCount = 0 }: PRHistoryContentProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((pr) => (
        <PRCard key={pr.url} pr={pr} />
      ))}
      {Array.from({ length: trailingSkeletonCount }).map((_, index) => (
        <CardSkeletonItem key={`trailing-skeleton-${index}`} />
      ))}
    </div>
  )
}
