import { Gauge } from 'lucide-react'
import { DetailPanel } from './DetailPanel'
import {
  DIMENSION_LABELS,
  DIMENSION_MAX_MAGNITUDE,
  DIMENSION_ORDER,
  formatScore,
} from '@/lib/github/issues/score-breakdown-meta'
import { cn } from '@/lib/utils'
import type { ScoreBreakdown } from '@/types/issue'

type ScoreBreakdownPanelProps = {
  score: number
  scoreBreakdown: ScoreBreakdown
}

// 카드 툴팁에서 항목별 기여 점수를 순간 노출하던 것을, 상세 페이지에서는 미니 바 차트와 함께
// 항상 노출되는 사이드바 패널로 승격한다. 바 길이는 각 차원의 대략적 최대치(DIMENSION_MAX_MAGNITUDE)
// 대비 비율이라 차원끼리 절대 비교는 안 되고, "이 차원이 자기 범위 안에서 얼마나 크게 기여했는지"만 보여준다.
export function ScoreBreakdownPanel({ score, scoreBreakdown }: ScoreBreakdownPanelProps) {
  return (
    <DetailPanel icon={Gauge} label="매칭 점수 분석">
      <div className="flex flex-col gap-3">
        {DIMENSION_ORDER.map((key) => {
          const value = scoreBreakdown[key]
          const magnitude = Math.min(Math.abs(value), DIMENSION_MAX_MAGNITUDE[key])
          const fillPercent = (magnitude / DIMENSION_MAX_MAGNITUDE[key]) * 100
          const valueColor = value > 0 ? 'text-interactive-action' : value < 0 ? 'text-destructive' : 'text-muted-foreground'
          const barColor = value > 0 ? 'bg-interactive-action' : value < 0 ? 'bg-destructive' : 'bg-border'

          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{DIMENSION_LABELS[key]}</span>
                <span className={cn('tabular-nums font-medium', valueColor)}>{formatScore(value)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full', barColor)} style={{ width: `${fillPercent}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs font-semibold">합계</span>
        <span className="tabular-nums text-sm font-semibold text-interactive-action">{score}</span>
      </div>
    </DetailPanel>
  )
}
