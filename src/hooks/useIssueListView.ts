'use client'

import { useIssueBookmarks } from './useIssueBookmarks'
import { useIssueList } from './useIssueList'
import { useInfiniteScrollDisplay } from './useScrollSentinel'
import type { IssueFilters, IssueSearchState } from '@/types/issue'

// 검색은 이제 서버가 GitHub 전체를 대상으로 수행한다(제출된 검색어가 요청 자체에 실려간다) —
// 그래서 예전처럼 "이미 로드된 목록 안에서" 다시 거르는 클라이언트 텍스트 필터가 필요 없다.
//
// 난이도/진행상태/기여방식/추천점수/최소스타 같은 후처리 필터는 GitHub 쿼리로 보낼 수 없어
// 응답을 받은 뒤(service.ts) 걸러지는데, 그 때문에 어떤 페이지가 적게(또는 0개) 나와도
// 별도 "더 찾아보기" 버튼을 두지 않는다 — 기본 목록과 동일하게 무한스크롤이 같은 조건으로
// 다음 페이지를 자동으로 계속 가져와 다시 필터링한다(useInfiniteScrollDisplay가 그대로 담당).
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
    const { displayItems, effectiveHasNextPage, sentinelRef } = useInfiniteScrollDisplay({
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
    }
}
