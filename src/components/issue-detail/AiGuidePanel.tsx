import { AlertTriangle, Brain, FileCode2, Flag, Info, Sparkles, Target, TrendingUp } from 'lucide-react'
import { ContributionGuideDialog } from './ContributionGuideDialog'
import { DetailPanel } from './DetailPanel'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { IssueAnalysis } from '@/lib/ai'

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
          <Card size="sm" className="col-span-4 border border-border bg-foreground/[0.03]">
            <CardContent>
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Brain className="size-3.5" />
                필요한 개념
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.concepts.map((concept) => (
                  <Badge
                    key={concept}
                    variant="outline"
                    className="rounded-md border-interactive-selected-border bg-interactive-selected px-2.5 py-1 text-xs font-semibold text-interactive-selected-foreground"
                  >
                    {concept}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card size="sm" className="col-span-4 border border-border bg-foreground/[0.03]">
            <CardContent>
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Target className="size-3.5" />
                작업 범위
              </span>
              <p className="mt-2 text-sm leading-relaxed">{analysis.scope}</p>
            </CardContent>
          </Card>

          <Card size="sm" className="col-span-4 border border-border bg-foreground/[0.03]">
            <CardContent>
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
            </CardContent>
          </Card>

          <Card size="sm" className="col-span-4 border border-status-warning-border bg-status-warning/60">
            <CardContent>
              <span className="flex items-center gap-1.5 text-xs font-bold text-status-warning-foreground">
                <AlertTriangle className="size-3.5" />
                주의할 점
              </span>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed">
                {analysis.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card size="sm" className="col-span-4 border border-brand-subtle-border bg-brand-subtle">
            <CardContent>
              <span className="flex items-center gap-1.5 text-xs font-bold text-brand-subtle-foreground">
                <TrendingUp className="size-3.5" />
                기대 효과
              </span>
              <p className="mt-2 text-sm leading-relaxed text-brand-subtle-foreground">{analysis.expectedBenefit}</p>
            </CardContent>
          </Card>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          AI 가이드는 참고용이에요. 실제 코드와 다를 수 있으니 기여 전에 꼭 저장소를 직접 확인해 주세요.
        </p>
      </div>
    </DetailPanel>
  )
}
