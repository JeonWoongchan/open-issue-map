'use client'

import { useCallback, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { EXPLORE_FOREGROUND_FETCH_SIZE, EXPLORE_INITIAL_BATCH, ISSUE_LIST_STALE_TIME_MS } from '@/constants/scoring-rules'
import { fetchApi } from '@/lib/fetch-api'
import type { IssueFilters, IssueSearchState, ScoredIssue } from '@/types/issue'
import { DEFAULT_ISSUE_SEARCH_STATE, EMPTY_ISSUE_FILTERS } from '@/types/issue'
import type { IssueListPage } from '@/types/api'
import { QUERY_KEYS, toBaseResult, type BaseQueryResult } from './queryKeys'

// 배치(batch) 안에서의 위치 — offset=0이면 배치를 새로 여는 요청이다.
type IssuePageParam = { batch: string; offset: number }

const INITIAL_PAGE_PARAM: IssuePageParam = { batch: EXPLORE_INITIAL_BATCH, offset: 0 }

function buildIssueListSearchParams(
  pageParam: IssuePageParam,
  search: IssueSearchState,
  filters: IssueFilters,
): URLSearchParams {
  const params = new URLSearchParams()

  if (pageParam.batch !== EXPLORE_INITIAL_BATCH) {
    params.set('batch', pageParam.batch)
  }
  if (pageParam.offset !== 0) {
    params.set('offset', String(pageParam.offset))
  }
  if (search.query) {
    params.set('q', search.query)
  }
  params.set('sort', search.sort)
  if (search.githubLabel) {
    params.set('githubLabel', search.githubLabel)
  }
  if (search.languageGroup) {
    params.set('languageGroup', search.languageGroup)
  }
  if (filters.difficultyLevel) {
    params.set('difficultyLevel', filters.difficultyLevel)
  }
  for (const type of filters.contributionTypes) {
    params.append('contributionTypes', type)
  }
  for (const level of filters.competitionLevels) {
    params.append('competitionLevels', level)
  }
  if (filters.minScore !== null) {
    params.set('minScore', String(filters.minScore))
  }
  if (filters.minStars !== null) {
    params.set('minStars', String(filters.minStars))
  }

  return params
}

export type UseIssueListResult = BaseQueryResult & {
  issues: ScoredIssue[]
  hasNextPage: boolean
  fetchNextPageAction: () => void
  isFetchingNextPage: boolean
}

const DEFAULT_ERROR_MESSAGE = '오류가 발생했습니다.'

export function useIssueList(
  search: IssueSearchState = DEFAULT_ISSUE_SEARCH_STATE,
  filters: IssueFilters = EMPTY_ISSUE_FILTERS,
): UseIssueListResult {
  const query = useInfiniteQuery({
    queryKey: [
      ...QUERY_KEYS.issues,
      search.query,
      search.sort,
      search.githubLabel,
      search.languageGroup,
      filters.difficultyLevel,
      filters.contributionTypes,
      filters.competitionLevels,
      filters.minScore,
      filters.minStars,
    ],
    queryFn: ({ pageParam }) => {
      const params = buildIssueListSearchParams(pageParam as IssuePageParam, search, filters)

      return fetchApi<IssueListPage>(`/api/github/issues?${params}`, DEFAULT_ERROR_MESSAGE)
    },
    staleTime: ISSUE_LIST_STALE_TIME_MS,
    initialPageParam: INITIAL_PAGE_PARAM,
    // hasMore만 본다 — 난이도/진행상태/기여방식/추천점수/최소스타 같은 후처리 필터로 이번
    // 페이지가 적게(또는 0개) 나와도 별도 취급 없이, 기본 목록과 똑같이 같은 조건으로 다음
    // 페이지를 자동으로 계속 가져온다("더 찾아보기" 같은 수동 버튼을 두지 않는다).
    // nextBatch가 있으면(이번 배치의 foreground+background를 다 씀) 새 배치를 offset 0부터,
    // 없으면 같은 배치 안에서 offset만 다음 청크만큼 늘려 계속 요청한다.
    getNextPageParam: (lastPage): IssuePageParam | undefined => {
      if (!lastPage.hasMore) return undefined
      if (lastPage.nextBatch) return { batch: lastPage.nextBatch, offset: 0 }
      return { batch: lastPage.batch, offset: lastPage.offset + EXPLORE_FOREGROUND_FETCH_SIZE }
    },
  })

  const issues = useMemo(() => {
    const seen = new Set<string>()

    return (query.data?.pages.flatMap((page) => page.issues) ?? []).filter((issue) => {
      if (seen.has(issue.url)) {
        return false
      }

      seen.add(issue.url)
      return true
    })
  }, [query.data])

  // sentinel이 화면에 있는 동안 리렌더 시 중복 호출을 방지하기 위해 useCallback으로 안정화.
  // TanStack Query v5는 fetchNextPage 참조를 안정적으로 유지하므로 의존성으로 안전하다.
  const hasNextPage = Boolean(query.hasNextPage)
  const { fetchNextPage } = query
  const fetchNextPageAction = useCallback(() => {
    if (hasNextPage) void fetchNextPage()
  }, [hasNextPage, fetchNextPage])

  return {
    ...toBaseResult(query, DEFAULT_ERROR_MESSAGE),
    issues,
    hasNextPage,
    fetchNextPageAction,
    isFetchingNextPage: query.isFetchingNextPage,
  }
}
