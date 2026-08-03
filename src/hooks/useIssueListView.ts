'use client'

import { useIssueBookmarks } from './useIssueBookmarks'
import { useIssueList } from './useIssueList'
import { useInfiniteScrollDisplay } from './useScrollSentinel'
import type { IssueFilters, IssueSearchState } from '@/types/issue'

export function useIssueListView(search: IssueSearchState, filters: IssueFilters, columnCount: number) {
    const {
        issues,
        hasNextPage,
        fetchNextPageAction,
        isFetchingNextPage,
        isPending,
        isError,
        errorMessage,
        refetch,
    } = useIssueList(search, filters)

    const { optimisticIssues, toggleBookmark } = useIssueBookmarks({
        sourceIssues: issues,
        isSourceIssuesReady: !isPending && !isError,
    })

    // 이미 목록이 있는 상태에서 다음 페이지만 실패한 경우 — 기존 목록은 유지하고 하단에만 에러 표시
    const isNextPageError = isError && optimisticIssues.length > 0
    const { displayItems, effectiveHasNextPage, sentinelRef, sameRowSkeletonCount, newRowSkeletonCount } = useInfiniteScrollDisplay({
        items: optimisticIssues,
        hasNextPage,
        fetchNextPageAction,
        isFetchingNextPage,
        isError: isNextPageError,
        columnCount,
    })

    return {
        items: optimisticIssues,
        isPending,
        isError,
        errorMessage,
        refetch,
        displayItems,
        toggleBookmark,
        effectiveHasNextPage,
        isFetchingNextPage,
        isNextPageError,
        retryNextPageAction: fetchNextPageAction,
        sentinelRef,
        sameRowSkeletonCount,
        newRowSkeletonCount,
    }
}
