import { Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ScoreBreakdown, ScoreBreakdownKey } from '@/types/issue'

// 점수 표시 순서 — SCORING_DIMENSIONS key 순서와 동일하게 유지
const DIMENSION_ORDER: ScoreBreakdownKey[] = [
  'language',
  'difficulty',
  'contributionType',
  'competitionFit',
  'competitionPenalty',
  'timeBudget',
  'purpose',
  'stars',
]

const DIMENSION_LABELS: Record<ScoreBreakdownKey, string> = {
  language: '언어 일치',
  difficulty: '난이도 적합도',
  contributionType: '기여 유형',
  competitionFit: '경쟁도 적합',
  competitionPenalty: '경쟁도 패널티',
  timeBudget: '시간 예산',
  purpose: '목적 적합도',
  stars: '저장소 인지도',
}

function formatScore(score: number): string {
  return score > 0 ? `+${score}` : String(score)
}

type IssueScoreBadgeProps = {
  score: number
  scoreBreakdown?: ScoreBreakdown
  className?: string
}

export function IssueScoreBadge({ score, scoreBreakdown, className }: IssueScoreBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 select-none rounded-md border-transparent bg-interactive-action text-interactive-action-foreground',
        className,
      )}
    >
      <Zap className="h-3 w-3" />
      <span className="tabular-nums ">{score}</span>
    </Badge>
  )

  if (!scoreBreakdown) {
    return badge
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="min-w-44 p-3">
        <p className="mb-2 text-xs font-semibold">매칭 점수 분석</p>
        <div className="space-y-1">
          {DIMENSION_ORDER.map((key) => {
            const s = scoreBreakdown[key]
            const scoreColor = s > 0 ? 'text-popover-foreground' : s < 0 ? 'text-destructive' : 'text-muted-foreground'
            return (
              <div key={key} className="flex items-center justify-between gap-6">
                <span className={cn('text-xs', s === 0 && 'text-muted-foreground')}>
                  {DIMENSION_LABELS[key]}
                </span>
                <span className={cn('tabular-nums text-xs font-medium', scoreColor)}>
                  {formatScore(s)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="my-2 border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">합계</span>
          <span className="tabular-nums text-xs font-semibold text-interactive-action">{score}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
