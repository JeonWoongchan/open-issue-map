'use client'

import { CardListSkeleton } from './CardListSkeleton'

type InfiniteScrollTriggerProps = {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    sentinelRef: (node?: Element | null) => void
}

export function InfiniteScrollTrigger({
    hasNextPage,
    isFetchingNextPage,
    sentinelRef,
}: InfiniteScrollTriggerProps) {
    if (!hasNextPage) {
        return null
    }

    return (
        <>
            {isFetchingNextPage ? <CardListSkeleton count={2} /> : null}
            <div ref={sentinelRef} className="h-10" />
        </>
    )
}
