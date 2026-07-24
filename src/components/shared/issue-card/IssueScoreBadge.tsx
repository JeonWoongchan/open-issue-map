import { useId } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ScoreBreakdown, ScoreBreakdownKey } from '@/types/issue'

// 점수 표시 순서 — SCORING_DIMENSIONS key 순서와 동일하게 유지
const DIMENSION_ORDER: ScoreBreakdownKey[] = [
  'language',
  'difficulty',
  'contributionType',
  'competition',
  'timeBudget',
  'purpose',
  'stars',
]

const DIMENSION_LABELS: Record<ScoreBreakdownKey, string> = {
  language: '언어 일치',
  difficulty: '난이도 적합도',
  contributionType: '기여 유형',
  competition: '경쟁도',
  timeBudget: '시간 예산',
  purpose: '목적 적합도',
  stars: '저장소 인지도',
}

function formatScore(score: number): string {
  return score > 0 ? `+${score}` : String(score)
}

// 카드에서는 소형, 상세 페이지 헤더에서는 대형 — 링 지름과 스트로크는 같은 비율(약 8%)로 유지
const RING_SIZE = { sm: 36, lg: 60 } as const
const STROKE_WIDTH = { sm: 3, lg: 5 } as const
const TEXT_SIZE = { sm: 'text-[11px]', lg: 'text-base' } as const

type IssueScoreBadgeProps = {
  score: number
  scoreBreakdown?: ScoreBreakdown
  size?: 'sm' | 'lg'
  className?: string
}

export function IssueScoreBadge({ score, scoreBreakdown, size = 'sm', className }: IssueScoreBadgeProps) {
  const gradientId = useId()
  const dimension = RING_SIZE[size]
  const strokeWidth = STROKE_WIDTH[size]
  const center = dimension / 2
  const radius = center - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  // 점수가 100을 넘거나 음수여도 링 채움은 0~100% 범위로만 시각화한다.
  const fillRatio = Math.min(100, Math.max(0, score)) / 100
  const dashOffset = circumference * (1 - fillRatio)

  const ring = (
    <div
      role="img"
      aria-label={`매칭 점수 ${score}점, 100점 만점`}
      className={cn('relative inline-flex shrink-0 select-none items-center justify-center', className)}
      style={{ width: dimension, height: dimension }}
    >
      <svg width={dimension} height={dimension} className="-rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-border" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          stroke={`url(#${gradientId})`}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--interactive-action-hover)" />
            <stop offset="100%" stopColor="var(--interactive-action)" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-semibold tabular-nums text-interactive-action',
          TEXT_SIZE[size]
        )}
      >
        {score}
      </span>
    </div>
  )

  if (!scoreBreakdown) {
    return ring
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {ring}
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
