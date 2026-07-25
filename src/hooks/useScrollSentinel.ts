'use client'

import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

// 무한 스크롤 목록에서 sentinel이 보일 때 다음 페이지를 요청한다.
// isSearchActive가 true이면 클라이언트 검색 중으로 간주해 추가 로드와 나머지 처리를 비활성화한다.
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
}): { displayItems: T[]; effectiveHasNextPage: boolean; sentinelRef: (node?: Element | null) => void } {
    const effectiveHasNextPage = isSearchActive ? false : hasNextPage
    // 아직 더 불러올 페이지가 있으면, 현재 화면의 그리드 열 수에 안 맞는 마지막 줄(빈 칸이 생기는 상태)은
    // 다음 페이지가 채워질 때까지 숨긴다.
    const remainder = items.length % columnCount
    const displayItems = effectiveHasNextPage && remainder !== 0 ? items.slice(0, -remainder) : items

    const { ref, inView } = useInView({ rootMargin: '100px' })

    useEffect(() => {
        if (inView && effectiveHasNextPage && !isFetchingNextPage && !isError) {
            fetchNextPageAction()
        }
    }, [inView, effectiveHasNextPage, isFetchingNextPage, isError, fetchNextPageAction])

    return { displayItems, effectiveHasNextPage, sentinelRef: ref }
}
