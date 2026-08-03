'use client'

import { CardListError } from './CardListError'
import { CardListSkeleton } from './CardListSkeleton'

type InfiniteScrollTriggerProps = {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    // 다음 페이지 요청이 실패한 상태 — true면 sentinel 대신 에러+재시도를 보여주고 자동 재요청을 멈춘다.
    isError?: boolean
    errorMessage?: string
    errorVariant?: 'danger' | 'warning'
    onRetryAction?: () => void
    sentinelRefAction: (node?: Element | null) => void
    // 로딩 스켈레톤을 몇 개 보여줄지 — 호출부의 그리드 열 수(useResponsiveColumnCount 결과)를 그대로 받는다.
    columnCount?: number
}

export function InfiniteScrollTrigger({
    hasNextPage,
    isFetchingNextPage,
    isError = false,
    errorMessage,
    errorVariant,
    onRetryAction,
    sentinelRefAction,
    columnCount = 1,
}: InfiniteScrollTriggerProps) {
    if (!hasNextPage) {
        return null
    }

    if (isError) {
        return (
            <CardListError
                message={errorMessage ?? '다음 이슈를 불러오지 못했습니다.'}
                onRetry={onRetryAction}
                variant={errorVariant}
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
