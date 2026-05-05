import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PullRequestState } from '@/types/pull-request'

type PRStateFilterProps = {
  current: PullRequestState | null
  onChangeAction: (state: PullRequestState | null) => void
}

// null 값은 전체 조회를 의미한다.
const FILTERS: { label: string; value: PullRequestState | null }[] = [
  { label: '전체', value: null },
  { label: '진행 중', value: 'OPEN' },
  { label: '병합됨', value: 'MERGED' },
  { label: '종료됨', value: 'CLOSED' },
]

export function PRStateFilter({ current, onChangeAction }: PRStateFilterProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.label}
            variant="outline"
            size="sm"
            className={cn(
              'text-xs',
              current === filter.value
                ? 'border-interactive-selected-border bg-interactive-selected text-interactive-action-hover'
                : 'text-muted-foreground hover:bg-interactive-hover'
            )}
            onClick={() => onChangeAction(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
      <p className="self-end text-right text-xs text-muted-foreground">
        * 본인 소유 저장소에 올린 PR은 제외한 목록만 표시됩니다.
      </p>
    </div>
  )
}
