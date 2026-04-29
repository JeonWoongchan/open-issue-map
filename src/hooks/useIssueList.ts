'use client'

import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/fetch-api'
import { PAGE_SIZE } from '@/constants/scoring-rules'
import { INITIAL_BATCH } from '@/lib/github/batch'
import type { ScoredIssue } from '@/types/issue'
import { QUERY_KEYS, toBaseResult, type BaseQueryResult } from './queryKeys'

type IssuePageParam = {
    offset: number
    batch: string
}

type IssueListPage = {
    issues: ScoredIssue[]
    total: number
    hasMore: boolean
    offset: number
    batch: string
    nextBatch: string | null
    partialResults: boolean
    failedQueryCount: number
}

export type UseIssueListResult = BaseQueryResult & {
    issues: ScoredIssue[]
    hasNextPage: boolean
    fetchNextPage: () => void
    isFetchingNextPage: boolean
    partial: boolean
    failedCount: number
}

const DEFAULT_ERROR_MESSAGE = '오류가 발생했습니다.'

export function useIssueList(): UseIssueListResult {
    const query = useInfiniteQuery({
        queryKey: QUERY_KEYS.issues,
        queryFn: ({ pageParam }) => {
            const { offset, batch } = pageParam as IssuePageParam
            const batchQuery = batch !== INITIAL_BATCH ? `&batch=${batch}` : ''
            return fetchApi<IssueListPage>(
                `/api/github/issues?offset=${offset}${batchQuery}`,
                DEFAULT_ERROR_MESSAGE,
            )
        },
        initialPageParam: { offset: 0, batch: INITIAL_BATCH } as IssuePageParam,
        // 다음 요청 파라미터 결정:
        //   현재 배치에 더 있으면 → offset만 증가해 같은 배치 캐시에서 다음 페이지 요청
        //   현재 배치 소진 + nextBatch 있으면 → offset 0으로 리셋 후 새 GitHub 배치 요청
        //   둘 다 없으면 → undefined 반환으로 무한스크롤 종료
        getNextPageParam: (lastPage): IssuePageParam | undefined => {
            const nextOffset = lastPage.offset + PAGE_SIZE
            if (nextOffset < lastPage.total) return { offset: nextOffset, batch: lastPage.batch }
            if (lastPage.nextBatch) return { offset: 0, batch: lastPage.nextBatch }
            return undefined
        },
    })

    const issues = useMemo(() => {
        const seen = new Set<string>()
        return (query.data?.pages.flatMap((p) => p.issues) ?? []).filter((issue) => {
            if (seen.has(issue.url)) return false
            seen.add(issue.url)
            return true
        })
    }, [query.data])

    const lastPage = query.data?.pages.at(-1)

    return {
        ...toBaseResult(query, DEFAULT_ERROR_MESSAGE),
        issues,
        hasNextPage: query.hasNextPage,
        fetchNextPage: () => { void query.fetchNextPage() },
        isFetchingNextPage: query.isFetchingNextPage,
        partial: lastPage?.partialResults ?? false,
        failedCount: lastPage?.failedQueryCount ?? 0,
    }
}
