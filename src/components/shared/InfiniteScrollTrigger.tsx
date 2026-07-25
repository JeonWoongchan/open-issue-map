'use client'

import { useResponsiveColumnCount } from '@/hooks/useResponsiveColumnCount'
import { CardListError } from './CardListError'
import { CardListSkeleton } from './CardListSkeleton'

type InfiniteScrollTriggerProps = {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    // 다음 페이지 요청이 실패한 상태 — true면 sentinel 대신 에러+재시도를 보여주고 자동 재요청을 멈춘다.
    isError?: boolean
    errorMessage?: string
    onRetryAction?: () => void
    sentinelRefAction: (node?: Element | null) => void
}

export function InfiniteScrollTrigger({
    hasNextPage,
    isFetchingNextPage,
    isError = false,
    errorMessage,
    onRetryAction,
    sentinelRefAction,
}: InfiniteScrollTriggerProps) {
    const columnCount = useResponsiveColumnCount()

    if (!hasNextPage) {
        return null
    }

    if (isError) {
        return (
            <CardListError
                message={errorMessage ?? '다음 이슈를 불러오지 못했습니다.'}
                onRetry={onRetryAction}
            />
        )
    }

    return (
        <>
            {isFetchingNextPage ? <CardListSkeleton count={columnCount} /> : null}
            <div ref={sentinelRefAction} className="h-10" />
        </>
    )
}
