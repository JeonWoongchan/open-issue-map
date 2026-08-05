import { Check, CircleAlert, Info, ShieldCheck } from 'lucide-react'
import { DetailPanel } from './DetailPanel'
import type { ContributionGuideInsight } from '@/lib/ai'

type ContributionRulesPanelProps = {
  // 파일 존재 여부·경로만 필요해 IssueAnalysis['contributionRules']와 동일한 형태를 받는다.
  rules: {
    contributingGuidePath: string | null
    pullRequestTemplatePath: string | null
  }
  insight: ContributionGuideInsight
}

type PathRowProps = {
  label: string
  path: string | null
}

// 경로를 찾았으면 "확인했어요" 대신 실제 경로를 보여준다 — 어디서 찾았는지 바로 알 수 있게.
function PathRow({ label, path }: PathRowProps) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 text-sm">
      {path ? (
        <Check className="mt-0.5 size-4 shrink-0 text-status-success-foreground" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        {path ? (
          <code className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{path}</code>
        ) : (
          <p className="text-xs text-muted-foreground">저장소에서 찾지 못했어요.</p>
        )}
      </div>
    </div>
  )
}

// 커밋 컨벤션·CLA는 존재 여부(y/n)가 아니라 AI가 CONTRIBUTING 원문을 읽고 판단한 서술이라
// PathRow(체크/경고 아이콘 + 경로)와 달리 중립 아이콘 + 문장으로 보여준다.
function NoteRow({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        <p className="break-words break-keep text-pretty text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  )
}

// CONTRIBUTING.md/PR 템플릿 경로는 파일 조회로 결정론적으로 판별하지만(rules),
// 커밋 컨벤션·CLA는 문서 내용을 문맥까지 읽어야 판단할 수 있어 AI 분석 결과(insight)를 받는다.
export function ContributionRulesPanel({ rules, insight }: ContributionRulesPanelProps) {
  return (
    <DetailPanel icon={ShieldCheck} label="기여 규칙">
      <div className="flex min-w-0 flex-col gap-3">
        <PathRow label="CONTRIBUTING.md" path={rules.contributingGuidePath} />
        <PathRow label="PR 템플릿" path={rules.pullRequestTemplatePath} />
        <NoteRow label="커밋 컨벤션" note={insight.commitConventionNote} />
        <NoteRow label="CLA (기여자 라이선스 동의)" note={insight.claNote} />
      </div>
    </DetailPanel>
  )
}
