'use client'

import { CardListSkeleton } from './CardListSkeleton'

type InfiniteScrollTriggerProps = {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    sentinelRefAction: (node?: Element | null) => void
}

export function InfiniteScrollTrigger({
    hasNextPage,
    isFetchingNextPage,
    sentinelRefAction,
}: InfiniteScrollTriggerProps) {
    if (!hasNextPage) {
        return null
    }

    return (
        <>
            {isFetchingNextPage ? <CardListSkeleton count={2} /> : null}
            <div ref={sentinelRefAction} className="h-10" />
        </>
    )
}
