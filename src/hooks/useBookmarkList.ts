'use client'

import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/fetch-api'
import type { IssueCardItem } from '@/types/issue'
import type { BookmarkListPage } from '@/types/api'
import { QUERY_KEYS, toBaseResult, type BaseQueryResult } from './queryKeys'

export type UseBookmarkListResult = BaseQueryResult & {
  issues: IssueCardItem[]
  hasNextPage: boolean
  fetchNextPageAction: () => void
  isFetchingNextPage: boolean
}

const DEFAULT_ERROR_MESSAGE = '북마크 목록을 불러오지 못했습니다.'

export function useBookmarkList(): UseBookmarkListResult {
  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.bookmarks,
    // 북마크는 DB에서 바로 읽는 가벼운 목록이고 다른 화면에서도 변경될 수 있다.
    // 페이지를 다시 열 때 이전 목록을 먼저 보여주지 않고 항상 첫 페이지부터 새로 조회한다.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    queryFn: ({ pageParam }) =>
      fetchApi<BookmarkListPage>(`/api/bookmarks?offset=${pageParam}`, DEFAULT_ERROR_MESSAGE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? lastPage.pageInfo.offset + lastPage.pageInfo.limit : undefined,
  })

  const issues = useMemo(() => query.data?.pages.flatMap((page) => page.issues) ?? [], [query.data])

  return {
    ...toBaseResult(query, DEFAULT_ERROR_MESSAGE),
    issues,
    hasNextPage: query.hasNextPage,
    fetchNextPageAction: () => {
      void query.fetchNextPage()
    },
    isFetchingNextPage: query.isFetchingNextPage,
  }
}
