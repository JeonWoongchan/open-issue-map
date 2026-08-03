'use client'

import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

export function useInfiniteScrollDisplay<T>({
    items,
    hasNextPage,
    fetchNextPageAction,
    isFetchingNextPage,
    isError = false,
    isSearchActive = false,
    columnCount = 1,
}: {
    items: T[]
    hasNextPage: boolean
    fetchNextPageAction: () => void
    isFetchingNextPage: boolean
    isError?: boolean
    isSearchActive?: boolean
    // 호출부의 그리드가 실제로 쓰는 열 수(useResponsiveColumnCount 결과) — 이 훅 안에서 직접
    // 구독하면 같은 화면에서 InfiniteScrollTrigger와 이중 구독이 생기므로 값만 전달받는다.
    columnCount?: number
}): {
    displayItems: T[]
    effectiveHasNextPage: boolean
    sentinelRef: (node?: Element | null) => void
    // 마지막 줄이 덜 채워진 상태(예: 4열 중 2개)일 때, 그 줄을 마저 채우는 스켈레톤 개수 —
    // 목록 그리드 "안"에 이어붙여야 실제 카드와 같은 줄에 렌더된다(호출부가 Content 컴포넌트에 전달).
    sameRowSkeletonCount: number
    newRowSkeletonCount: number
} {
    const effectiveHasNextPage = isSearchActive ? false : hasNextPage
    // 아직 더 불러올 페이지가 있으면, 현재 화면의 그리드 열 수에 안 맞는 마지막 줄(빈 칸이 생기는 상태)은
    const completeRowCount = Math.floor(items.length / columnCount)
    const trimmedCount = completeRowCount * columnCount
    const displayItems = effectiveHasNextPage && trimmedCount > 0 ? items.slice(0, trimmedCount) : items

    const lastRowCount = displayItems.length % columnCount
    const sameRowSkeletonCount = lastRowCount === 0 ? 0 : columnCount - lastRowCount
    const newRowSkeletonCount = lastRowCount === 0 ? columnCount : 0

    const { ref, inView } = useInView({ rootMargin: '100px' })

    useEffect(() => {
        if (inView && effectiveHasNextPage && !isFetchingNextPage && !isError) {
            fetchNextPageAction()
        }
    }, [inView, effectiveHasNextPage, isFetchingNextPage, isError, fetchNextPageAction])

    return { displayItems, effectiveHasNextPage, sentinelRef: ref, sameRowSkeletonCount, newRowSkeletonCount }
}
