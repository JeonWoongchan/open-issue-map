'use client'

import { cn } from '@/lib/utils'

type TabBarProps<T extends string> = {
  tabs: { key: T; label: string }[]
  active: T
  onChange: (key: T) => void
  // underline: 상위 탭(개요/AI가이드/관련 이슈)처럼 밑줄로 표시. pill: 패널 내부 하위 탭처럼 알약 배경으로 표시.
  variant?: 'underline' | 'pill'
}

// IssueDetailWorkspace(상위 탭)와 IssueOverviewPanel(본문 하위 탭)이 각각 따로 구현하던
// "state + {key,label}[] + role=tablist + map" 탭 전환 로직을 하나로 합친 것.
export function TabBar<T extends string>({ tabs, active, onChange, variant = 'underline' }: TabBarProps<T>) {
  return (
    <div role="tablist" className={cn('flex', variant === 'underline' ? 'gap-5 border-b border-border' : 'gap-1')}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'cursor-pointer font-semibold transition-colors',
            variant === 'underline'
              ? cn(
                  '-mb-px border-b-2 px-1 py-2.5 text-sm',
                  active === tab.key
                    ? 'border-interactive-action text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )
              : cn(
                  'rounded-md px-2.5 py-1 text-xs',
                  active === tab.key
                    ? 'bg-interactive-selected text-interactive-selected-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                ),
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
