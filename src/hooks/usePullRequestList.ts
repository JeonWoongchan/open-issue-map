'use client'

import { useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/fetch-api'
import { PAGE_SIZE } from '@/constants/scoring-rules'
import type { PullRequestItem, PullRequestState, PullRequestSummary } from '@/types/pull-request'
import { QUERY_KEYS, toBaseResult, type BaseQueryResult } from './queryKeys'

type PRListPage = {
    items: PullRequestItem[]
    summary: PullRequestSummary
    total: number
    hasMore: boolean
    offset: number
}

export type UsePullRequestListResult = BaseQueryResult & {
    items: PullRequestItem[]
    summary: PullRequestSummary | undefined
    stateFilter: PullRequestState | null
    setStateFilter: (state: PullRequestState | null) => void
    hasNextPage: boolean
    fetchNextPage: () => void
    isFetchingNextPage: boolean
}

const DEFAULT_ERROR = 'PR 목록을 불러오지 못했습니다.'

export function usePullRequestList(): UsePullRequestListResult {
    const [stateFilter, setStateFilter] = useState<PullRequestState | null>(null)

    const query = useInfiniteQuery({
        queryKey: [...QUERY_KEYS.pullRequests, stateFilter],
        queryFn: ({ pageParam }) => {
            const stateQuery = stateFilter ? `&state=${stateFilter}` : ''
            return fetchApi<PRListPage>(
                `/api/github/pull-requests?offset=${pageParam as number}${stateQuery}`,
                DEFAULT_ERROR,
            )
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? lastPage.offset + PAGE_SIZE : undefined,
    })

    const items = useMemo(
        () => query.data?.pages.flatMap((p) => p.items) ?? [],
        [query.data],
    )

    // 전체 통계는 캐시된 전체 결과 기준 — 첫 페이지에서 항상 정확한 값 포함
    const summary = query.data?.pages[0]?.summary

    return {
        ...toBaseResult(query, DEFAULT_ERROR),
        items,
        summary,
        stateFilter,
        setStateFilter,
        hasNextPage: query.hasNextPage,
        fetchNextPage: () => { void query.fetchNextPage() },
        isFetchingNextPage: query.isFetchingNextPage,
    }
}
