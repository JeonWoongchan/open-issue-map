import type { ComponentType, ReactNode } from 'react'
import { AlertTriangle, Brain, FileCode2, Flag, Sparkles, Target, TrendingUp } from 'lucide-react'
import { ContributionGuideDialog } from './ContributionGuideDialog'
import { DetailPanel, DetailPanelNotice } from './DetailPanel'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { IssueAnalysis } from '@/lib/ai'

type AiGuidePanelProps = {
  analysis: IssueAnalysis
}

type GuideCardProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  children: ReactNode
  className?: string
  labelClassName?: string
}

// AI 가이드의 모든 하위 카드는 같은 shadcn 셸과 모바일 shrink 규칙을 공유한다.
function GuideCard({ icon: Icon, label, children, className, labelClassName }: GuideCardProps) {
  return (
    <Card size="sm" className={cn('min-w-0 border border-border bg-foreground/[0.03]', className)}>
      <CardContent className="min-w-0">
        <span className={cn('flex items-center gap-1.5 text-xs font-bold text-muted-foreground', labelClassName)}>
          <Icon className="size-3.5 shrink-0" aria-hidden="true" />
          {label}
        </span>
        {children}
      </CardContent>
    </Card>
  )
}

// IssueOverviewPanel·ContributionRulesPanel과 같은 패턴으로 뽑아낸 패널 —
// 이전엔 이 컴포넌트만 IssueGuideWorkspace 안에 인라인으로 남아 있었다.
export function AiGuidePanel({ analysis }: AiGuidePanelProps) {
  return (
    <DetailPanel icon={Sparkles} label="AI 가이드" action={<ContributionGuideDialog />}>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid min-w-0 grid-cols-1 gap-3">
          <GuideCard icon={Brain} label="필요한 개념">
            <div className="mt-2 flex flex-wrap gap-1.5">
              {analysis.concepts.map((concept) => (
                <Badge
                  key={concept}
                  variant="outline"
                  size="lg"
                  className="max-w-full shrink whitespace-normal [overflow-wrap:anywhere] break-keep rounded-md border-interactive-selected-border bg-interactive-selected text-pretty font-semibold text-interactive-selected-foreground"
                >
                  {concept}
                </Badge>
              ))}
            </div>
          </GuideCard>

          <GuideCard icon={Target} label="작업 범위">
            <p className="mt-2 break-words break-keep text-pretty text-sm leading-relaxed">{analysis.scope}</p>
          </GuideCard>

          <GuideCard icon={Flag} label="시작 지점">
              <ul className="mt-2 flex flex-col gap-1.5">
                {analysis.startingPoints.map((point) => (
                  <li key={point} className="flex min-w-0 items-start gap-1.5 text-xs">
                    <FileCode2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <code className="min-w-0 font-mono [overflow-wrap:anywhere]">{point}</code>
                  </li>
                ))}
              </ul>
          </GuideCard>

          <GuideCard
            icon={AlertTriangle}
            label="주의할 점"
            className="border-status-warning-border bg-status-warning/60"
            labelClassName="text-status-warning-foreground"
          >
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed">
              {analysis.cautions.map((caution) => (
                <li key={caution} className="break-words break-keep text-pretty">{caution}</li>
              ))}
            </ul>
          </GuideCard>

          <GuideCard
            icon={TrendingUp}
            label="기대 효과"
            className="border-brand-subtle-border bg-brand-subtle"
            labelClassName="text-brand-subtle-foreground"
          >
            <p className="mt-2 break-words break-keep text-pretty text-sm leading-relaxed text-brand-subtle-foreground">
              {analysis.expectedBenefit}
            </p>
          </GuideCard>
        </div>

        <DetailPanelNotice>
          AI 가이드는 참고용이에요. 실제 코드와 다를 수 있으니 기여 전에 꼭 저장소를 직접 확인해 주세요.
        </DetailPanelNotice>
      </div>
    </DetailPanel>
  )
}
