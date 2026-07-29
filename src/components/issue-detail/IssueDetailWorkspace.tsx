'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { TabBar } from './TabBar'

type TabKey = 'overview' | 'aiGuide' | 'related'

type IssueDetailWorkspaceProps = {
  overview: ReactNode
  aiGuide: ReactNode
  related: ReactNode
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '개요' },
  { key: 'aiGuide', label: 'AI 가이드' },
  { key: 'related', label: '관련 이슈' },
]

// 이슈 개요·기여 규칙 / AI 가이드 / 관련 이슈를 한 화면에 다 쌓아 보여주던 것을 탭으로 묶는다.
// 비활성 탭도 언마운트하지 않고 hidden 속성으로만 감춰서, IssueGuideWorkspace의 마운트 시 자동 분석 요청이
// 탭을 오갈 때마다 재실행되지 않게 한다.
export function IssueDetailWorkspace({ overview, aiGuide, related }: IssueDetailWorkspaceProps) {
  const [active, setActive] = useState<TabKey>('overview')
  const panels: Record<TabKey, ReactNode> = { overview, aiGuide, related }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <TabBar tabs={TABS} active={active} onChange={setActive} />

      {TABS.map((tab) => (
        <div key={tab.key} hidden={active !== tab.key} className="flex flex-col gap-4">
          {panels[tab.key]}
        </div>
      ))}
    </div>
  )
}
