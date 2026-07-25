'use client'

import { useEffect, useState } from 'react'
import { useIssueBookmarks } from './useIssueBookmarks'
import { useIssueCandidateLoadMoreFeedback } from './useIssueCandidateLoadMoreFeedback'
import { useIssueList } from './useIssueList'
import { useSearchFilter } from './useSearchFilter'
import { useInfiniteScrollDisplay } from './useScrollSentinel'
import type { IssueFilters } from '@/types/issue'

export function useIssueListView(filters: IssueFilters, query: string, columnCount: number) {
    const {
        issues,
        hasNextPage,
        fetchNextPageAction,
        fetchMoreCandidatesAction,
        isFetchingNextPage,
        canLoadMoreCandidates,
        isPending,
        isError,
        errorMessage,
        refetch,
        availableLanguages,
    } = useIssueList(filters)

    // 로딩 중에도 언어 필터 옵션이 사라지지 않도록 마지막 성공값을 유지
    const [lastAvailableLanguages, setLastAvailableLanguages] = useState<string[]>([])

    useEffect(() => {
        if (!isPending && !isError) {
            setLastAvailableLanguages(availableLanguages)
        }
    }, [availableLanguages, isError, isPending])

    const filterAvailableLanguages =
        isPending && lastAvailableLanguages.length > 0 ? lastAvailableLanguages : availableLanguages

    const { optimisticIssues, toggleBookmark } = useIssueBookmarks({
        sourceIssues: issues,
        isSourceIssuesReady: !isPending && !isError,
    })

    const filteredItems = useSearchFilter(optimisticIssues, query)
    // 이미 목록이 있는 상태에서 다음 페이지만 실패한 경우 — 기존 목록은 유지하고 하단에만 에러 표시
    const isNextPageError = isError && optimisticIssues.length > 0
    const { displayItems, effectiveHasNextPage, sentinelRef } = useInfiniteScrollDisplay({
        items: filteredItems,
        hasNextPage,
        fetchNextPageAction,
        isFetchingNextPage,
        isError: isNextPageError,
        isSearchActive: !!query,
        columnCount,
    })

    const {
        emptyCandidateFetchCount,
        shouldShowCandidateLoadMoreNotice,
        loadMoreCandidatesAction,
    } = useIssueCandidateLoadMoreFeedback({
        filters,
        issueCount: issues.length,
        isFetchingNextPage,
        canLoadMoreCandidates,
        fetchMoreCandidatesAction,
    })

    return {
        filterAvailableLanguages,
        filteredItems,
        totalCount: optimisticIssues.length,
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
        shouldShowCandidateLoadMoreNotice,
        emptyCandidateFetchCount,
        canLoadMoreCandidates,
        loadMoreCandidatesAction,
    }
}
