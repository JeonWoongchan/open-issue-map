import { Check, CircleAlert, ShieldCheck } from 'lucide-react'
import { DetailPanel } from './DetailPanel'
import { cn } from '@/lib/utils'
import type { ContributionRules } from '@/lib/github/contribution-rules'

type ContributionRulesPanelProps = {
  rules: ContributionRules
}

type RuleRowProps = {
  label: string
  isDetected: boolean
  detectedText: string
  missingText: string
  warnOnMissing?: boolean
}

function RuleRow({ label, isDetected, detectedText, missingText, warnOnMissing }: RuleRowProps) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      {isDetected ? (
        <Check className="mt-0.5 size-4 shrink-0 text-status-success-foreground" />
      ) : (
        <CircleAlert
          className={cn('mt-0.5 size-4 shrink-0', warnOnMissing ? 'text-status-warning-foreground' : 'text-muted-foreground')}
        />
      )}
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{isDetected ? detectedText : missingText}</p>
      </div>
    </div>
  )
}

// 레포마다 기여 규칙이 다를 수 있어(요청 반영) CONTRIBUTING.md/PR 템플릿/커밋 컨벤션/CLA를
// 실제로 저장소에서 조회한 결과를 보여준다 — CLA는 감지 안 되면 "없음"이 아니라 "확인 필요"로 표시한다.
export function ContributionRulesPanel({ rules }: ContributionRulesPanelProps) {
  return (
    <DetailPanel icon={ShieldCheck} label="기여 규칙">
      <div className="flex flex-col gap-3">
        <RuleRow
          label="CONTRIBUTING.md"
          isDetected={rules.hasContributingGuide}
          detectedText="저장소에서 확인했어요."
          missingText="저장소에서 찾지 못했어요."
        />
        <RuleRow
          label="PR 템플릿"
          isDetected={rules.hasPullRequestTemplate}
          detectedText="저장소에서 확인했어요."
          missingText="저장소에서 찾지 못했어요."
        />
        <RuleRow
          label="커밋 컨벤션"
          isDetected={rules.hasCommitConvention}
          detectedText="문서에서 관련 언급을 확인했어요."
          missingText="문서에서 명시적으로 언급되지 않았어요."
        />
        <RuleRow
          label="CLA (기여자 라이선스 동의)"
          isDetected={rules.claStatus === 'detected'}
          detectedText="문서에서 관련 언급을 확인했어요 — 정확한 절차는 문서를 확인하세요."
          missingText="문서에서 확인되지 않았어요 — 필요 여부는 저장소에서 직접 확인해 주세요."
          warnOnMissing
        />
      </div>
    </DetailPanel>
  )
}
