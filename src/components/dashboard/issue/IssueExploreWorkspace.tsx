'use client'

import { useState } from 'react'
import { IssueList } from './IssueList'
import { DEFAULT_ISSUE_SEARCH_STATE, EMPTY_ISSUE_FILTERS } from '@/types/issue'
import type { IssueFilters, IssueSearchState } from '@/types/issue'

type IssueExploreWorkspaceProps = {
  isGuest: boolean
}

export function IssueExploreWorkspace({ isGuest }: IssueExploreWorkspaceProps) {
  // 검색창·프리셋·정렬·필터가 전부 같은 상태를 공유해야 해서 이 계층에서 소유한다.
  const [search, setSearch] = useState<IssueSearchState>(DEFAULT_ISSUE_SEARCH_STATE)
  const [filters, setFilters] = useState<IssueFilters>(EMPTY_ISSUE_FILTERS)

  return (
    <IssueList
      isGuest={isGuest}
      search={search}
      onSearchChangeAction={setSearch}
      filters={filters}
      onFiltersChangeAction={setFilters}
    />
  )
}
