'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { DashboardReportCard } from '@/components/dashboard/DashboardReportCard'
import { IssueList } from '@/components/dashboard/issue/IssueList'
import { EMPTY_ISSUE_FILTERS } from '@/types/issue'
import type { IssueFilters } from '@/types/issue'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { OnboardingInsight } from '@/types/onboarding-insight'

type DashboardWorkspaceProps = {
  isGuest: boolean
  helpSlot: ReactNode
  profile: OnboardingProfile | null
  insight: OnboardingInsight | null
}

export function DashboardWorkspace({ isGuest, helpSlot, profile, insight }: DashboardWorkspaceProps) {
  // 상단 추천 필터 버튼과 이슈 목록이 같은 필터 상태를 공유해야 해서 이 계층에서 소유한다.
  const [filters, setFilters] = useState<IssueFilters>(EMPTY_ISSUE_FILTERS)

  return (
    <div className="flex flex-col gap-4">
      {profile && insight ? (
        <>
          <DashboardReportCard profile={profile} insight={insight} />
        </>
      ) : null}
      <div className="flex flex-col gap-4">
        {/*<SectionHeading title="추천 이슈" />*/}
        <IssueList isGuest={isGuest} helpSlot={helpSlot} filters={filters} onFiltersChangeAction={setFilters} />
      </div>
    </div>
  )
}
