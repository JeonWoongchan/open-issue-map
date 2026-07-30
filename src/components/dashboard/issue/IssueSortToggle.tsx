import { cn } from '@/lib/utils'
import type { IssueSort } from '@/types/issue'

type IssueSortToggleProps = {
  value: IssueSort
  onChangeAction: (sort: IssueSort) => void
}

const SORT_OPTIONS: { value: IssueSort; label: string }[] = [
  { value: 'popular', label: '인기순' },
  { value: 'latest', label: '최신순' },
]

export function IssueSortToggle({ value, onChangeAction }: IssueSortToggleProps) {
  return (
    <div className="inline-flex h-10 shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background p-1" role="group" aria-label="정렬">
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChangeAction(option.value)}
          className={cn(
            'h-full cursor-pointer rounded-md px-3 text-xs font-medium transition-colors',
            value === option.value
              ? 'bg-interactive-selected text-interactive-selected-foreground font-semibold'
              : 'text-muted-foreground hover:bg-interactive-hover hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
