'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type IssueSearchFormProps = {
  value: string
  onSubmitAction: (query: string) => void
  className?: string
}

// 이슈 탐색 전용 검색창 — 입력할 때마다 걸러지는 shared SearchBar(SearchBar.tsx, PR
// 히스토리·북마크가 여전히 쓰는 "로드된 목록 안에서 검색" 방식)와 달리, 제출(버튼/Enter)
// 시점에만 GitHub 전체 대상 검색을 새로 트리거한다.
export function IssueSearchForm({ value, onSubmitAction, className }: IssueSearchFormProps) {
  const [draft, setDraft] = useState(value)

  // 프리셋 클릭 등 외부에서 검색어가 바뀌면(예: 검색 초기화) 입력창도 따라간다.
  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <form
      className={cn('flex items-stretch gap-0', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmitAction(draft.trim())
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="text"
          aria-label="GitHub 전체 이슈 검색"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="GitHub 전체 이슈에서 검색"
          className="h-10 w-full rounded-l-lg border border-r-0 border-input bg-background pl-9 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {draft ? (
          <button
            type="button"
            onClick={() => {
              setDraft('')
              onSubmitAction('')
            }}
            aria-label="검색어 지우고 기본 목록 보기"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <button
        type="submit"
        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-r-lg border border-interactive-action bg-interactive-action px-3.5 text-sm font-semibold text-interactive-action-foreground transition-colors hover:bg-interactive-action-hover"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        검색
      </button>
    </form>
  )
}
