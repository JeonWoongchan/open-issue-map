import type { ReactNode } from 'react'
import { CardListEmpty } from '@/components/shared/CardListEmpty'
import { CardListError } from '@/components/shared/CardListError'
import { CardListSkeleton } from '@/components/shared/CardListSkeleton'

type DataListStateProps<T> = {
  isPending: boolean
  isError: boolean
  items: T[]
  errorMessage?: string
  errorVariant?: 'danger' | 'warning'
  onRetry?: () => void
  skeletonCount?: number
  hasNextPage?: boolean
  emptyTitle: string
  emptyDescription: string
  emptyDetail?: string
  emptyAction?: ReactNode
  renderContent: () => ReactNode
}

export function DataListState<T>({
  isPending,
  isError,
  items,
  errorMessage,
  errorVariant,
  onRetry,
  skeletonCount,
  hasNextPage = false,
  emptyTitle,
  emptyDescription,
  emptyDetail,
  emptyAction,
  renderContent,
}: DataListStateProps<T>) {
  if (isPending) {
    return <CardListSkeleton count={skeletonCount} />
  }

  // items가 이미 있으면(다음 페이지 요청 실패 등) 기존 목록은 유지하고, 하단 InfiniteScrollTrigger가 에러를 안내한다.
  if (isError && items.length === 0) {
    return <CardListError message={errorMessage ?? '목록을 불러오지 못했습니다.'} onRetry={onRetry} variant={errorVariant} />
  }

  // 필터 조건과 일치하는 항목이 아직 없지만 GitHub에 더 조회할 페이지가 남아있는 상태
  if (items.length === 0 && hasNextPage) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        조건에 맞는 이슈를 계속 찾고 있어요. 조건이 엄격할수록 시간이 걸릴 수 있어요 — 필터를 완화하면 더 빨리 찾을 수 있어요.
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <CardListEmpty
        title={emptyTitle}
        description={emptyDescription}
        detail={emptyDetail}
        action={emptyAction}
      />
    )
  }

  return <>{renderContent()}</>
}
