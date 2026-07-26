'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { IssueList } from './IssueList'
import { EMPTY_ISSUE_FILTERS } from '@/types/issue'
import type { IssueFilters } from '@/types/issue'

type IssueExploreWorkspaceProps = {
  isGuest: boolean
  helpSlot: ReactNode
}

export function IssueExploreWorkspace({ isGuest, helpSlot }: IssueExploreWorkspaceProps) {
  // 상단 필터 버튼과 이슈 목록이 같은 필터 상태를 공유해야 해서 이 계층에서 소유한다.
  const [filters, setFilters] = useState<IssueFilters>(EMPTY_ISSUE_FILTERS)

  return (
    <IssueList isGuest={isGuest} helpSlot={helpSlot} filters={filters} onFiltersChangeAction={setFilters} />
  )
}
