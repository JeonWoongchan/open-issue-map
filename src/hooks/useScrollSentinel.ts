'use client'

import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

// 무한 스크롤 목록에서 sentinel이 보일 때 다음 페이지를 요청한다.
// isSearchActive가 true이면 클라이언트 검색 중으로 간주해 추가 로드와 홀수 처리를 비활성화한다.
export function useInfiniteScrollDisplay<T>({
    items,
    hasNextPage,
    fetchNextPageAction,
    isFetchingNextPage,
    isSearchActive = false,
}: {
    items: T[]
    hasNextPage: boolean
    fetchNextPageAction: () => void
    isFetchingNextPage: boolean
    isSearchActive?: boolean
}): { displayItems: T[]; effectiveHasNextPage: boolean; sentinelRef: (node?: Element | null) => void } {
    const effectiveHasNextPage = isSearchActive ? false : hasNextPage
    const displayItems = effectiveHasNextPage && items.length % 2 !== 0 ? items.slice(0, -1) : items

    const { ref, inView } = useInView({ rootMargin: '100px' })

    useEffect(() => {
        if (inView && effectiveHasNextPage && !isFetchingNextPage) {
            fetchNextPageAction()
        }
    }, [inView, effectiveHasNextPage, isFetchingNextPage, fetchNextPageAction])

    return { displayItems, effectiveHasNextPage, sentinelRef: ref }
}
