import { AlertTriangle, Brain, FileCode2, Flag, Gauge, Info, Sparkles, Target, TrendingUp } from 'lucide-react'
import { ContributionGuideDialog } from './ContributionGuideDialog'
import { DetailPanel } from './DetailPanel'
import { cn } from '@/lib/utils'
import type { IssueAnalysis } from '@/lib/ai'

const DIFFICULTY_STYLES: Record<IssueAnalysis['difficulty'], string> = {
  쉬움: 'bg-status-success text-status-success-foreground',
  보통: 'bg-status-warning text-status-warning-foreground',
  어려움: 'bg-status-danger text-status-danger-foreground',
}

type AiGuidePanelProps = {
  analysis: IssueAnalysis
}

// IssueOverviewPanel·ContributionRulesPanel과 같은 패턴으로 뽑아낸 패널 —
// 이전엔 이 컴포넌트만 IssueGuideWorkspace 안에 인라인으로 남아 있었다.
export function AiGuidePanel({ analysis }: AiGuidePanelProps) {
  return (
    <DetailPanel icon={Sparkles} label="AI 가이드" action={<ContributionGuideDialog />}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-4 flex flex-row items-center gap-3 self-start rounded-xl border border-border bg-foreground/[0.03] p-3.5 sm:col-span-1 sm:flex-col sm:items-start sm:justify-center sm:gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Gauge className="size-3.5" />
              난이도
            </span>
            <span className={cn('rounded-full px-3 py-1 text-sm font-bold', DIFFICULTY_STYLES[analysis.difficulty])}>
              {analysis.difficulty}
            </span>
          </div>

          <div className="col-span-4 rounded-xl border border-border bg-foreground/[0.03] p-3.5 sm:col-span-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Brain className="size-3.5" />
              필요한 개념
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {analysis.concepts.map((concept) => (
                <span
                  key={concept}
                  className="rounded-md border border-interactive-selected-border bg-interactive-selected px-2.5 py-1 text-xs font-semibold text-interactive-selected-foreground"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>

          <div className="col-span-4 rounded-xl border border-border bg-foreground/[0.03] p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Target className="size-3.5" />
              작업 범위
            </span>
            <p className="mt-2 text-sm leading-relaxed">{analysis.scope}</p>
          </div>

          <div className="col-span-4 rounded-xl border border-border bg-foreground/[0.03] p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Flag className="size-3.5" />
              시작 지점
            </span>
            <ul className="mt-2 flex flex-col gap-1.5">
              {analysis.startingPoints.map((point) => (
                <li key={point} className="flex items-start gap-1.5 text-xs">
                  <FileCode2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <code className="break-all font-mono">{point}</code>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-4 rounded-xl border border-status-warning-border bg-status-warning/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-status-warning-foreground">
              <AlertTriangle className="size-3.5" />
              주의할 점
            </span>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed">
              {analysis.cautions.map((caution) => (
                <li key={caution}>{caution}</li>
              ))}
            </ul>
          </div>

          <div className="col-span-4 rounded-xl border border-brand-subtle-border bg-brand-subtle p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-brand-subtle-foreground">
              <TrendingUp className="size-3.5" />
              기대 효과
            </span>
            <p className="mt-2 text-sm leading-relaxed text-brand-subtle-foreground">{analysis.expectedBenefit}</p>
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          AI 가이드는 참고용이에요. 실제 코드와 다를 수 있으니 기여 전에 꼭 저장소를 직접 확인해 주세요.
        </p>
      </div>
    </DetailPanel>
  )
}
