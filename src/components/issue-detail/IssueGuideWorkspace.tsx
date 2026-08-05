'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FileText, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecommendationSearchingState } from '@/components/dashboard/recommendation/RecommendationSearchingState'
import { redirectToLogin } from '@/lib/client-auth'
import type { IssueAnalysis } from '@/lib/ai'
import type { ApiResponse } from '@/types/api'
import { AiGuidePanel } from './AiGuidePanel'
import { ContributionGuideDialog } from './ContributionGuideDialog'
import { ContributionRulesPanel } from './ContributionRulesPanel'
import { DetailPanel } from './DetailPanel'
import { IssueDetailWorkspace } from './IssueDetailWorkspace'
import { IssueOverviewPanel } from './IssueOverviewPanel'

type IssueGuideWorkspaceProps = {
  title: string
  body: string | null
  labels: string[]
  language: string | null
  repoFullName: string
  issueNumber: number
  issueUpdatedAt: string
  // 서버가 이미 DB 캐시에서 찾아 내려준 결과 — 있으면 마운트 시 재요청 없이 바로 렌더링한다.
  initialAnalysis: IssueAnalysis | null
  related: ReactNode
}

const AI_GUIDE_SEARCHING_PHRASES = [
  { text: '이슈와 저장소 정보를 읽고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:0s]' },
  { text: '필요한 배경 지식을 정리하고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:3s]' },
  { text: '접근 방법을 구상하고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:6s]' },
  { text: '마지막으로 다듬는 중이에요', animationClass: 'recommendation-searching-copy-slow [animation-delay:9s]' },
]
const AI_GUIDE_SEARCHING_FINAL_PHRASE = {
  text: '거의 다 됐어요, 잠시만 기다려 주세요',
  delayClass: '[animation-delay:15s]',
}

// 하나의 판별 유니온으로 관리한다 — 이전엔 state('loading'|'done'|'locked'|'error')와
// analysis(IssueAnalysis|null)를 별도 state로 둬서 "state==='done'인데 analysis===null" 같은
// 타입상 불가능해야 할 조합이 실제로는 막히지 않았고, 그걸 사람이 주석+캐스팅으로 증명해야 했다.
type GuideState =
  | { status: 'loading' }
  | { status: 'locked' }
  | { status: 'error'; message: string }
  | { status: 'done'; analysis: IssueAnalysis }

type BlockingState = Exclude<GuideState, { status: 'done' }>

type BlockingPanelProps = {
  icon: typeof Sparkles
  label: string
  state: BlockingState
  action?: ReactNode
}

// "개요"·"AI 가이드" 탭이 하나의 AI 응답을 함께 기다리므로, 로딩·잠김·에러 상태를 두 탭에서
// 동일하게 보여준다 — 탭마다 아이콘·라벨만 다르게 감싼다.
function BlockingPanel({ icon, label, state, action }: BlockingPanelProps) {
  return (
    <DetailPanel icon={icon} label={label} action={action}>
      {state.status === 'loading' ? (
        <RecommendationSearchingState
          phrases={AI_GUIDE_SEARCHING_PHRASES}
          finalPhrase={AI_GUIDE_SEARCHING_FINAL_PHRASE}
        />
      ) : state.status === 'locked' ? (
        <div className="flex min-w-0 items-start gap-4">
          <Lock className="mt-0.5 size-7 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-col gap-3">
            <div>
              <p className="text-sm font-semibold">비로그인 AI 기능을 모두 사용했어요</p>
              <p className="mt-1 max-w-[46ch] break-words break-keep text-pretty text-xs text-muted-foreground">
                비로그인 상태에서는 하루 3개 이슈까지 볼 수 있어요.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={redirectToLogin}>
              로그인하고 계속 보기
            </Button>
          </div>
        </div>
      ) : (
        <p className="break-words break-keep text-pretty text-xs text-status-danger-foreground">{state.message}</p>
      )}
    </DetailPanel>
  )
}

// 페이지 진입 시 자동 실행된다(버튼 클릭 불필요) — 게스트는 하루 3개 이슈까지만 실제로 생성되고
// (DB 캐시 히트는 한도를 소모하지 않는다), 초과하면 로그인 유도 상태를 보여준다.
// 이슈 개요·기여 규칙·AI 가이드를 하나의 AI 응답으로 함께 받아오므로, "개요" 탭도
// AI 가이드 탭과 같은 로딩/잠김/에러 상태를 공유한다.
export function IssueGuideWorkspace({
  title,
  body,
  labels,
  language,
  repoFullName,
  issueNumber,
  issueUpdatedAt,
  initialAnalysis,
  related,
}: IssueGuideWorkspaceProps) {
  const [guideState, setGuideState] = useState<GuideState>(
    initialAnalysis ? { status: 'done', analysis: initialAnalysis } : { status: 'loading' },
  )

  useEffect(() => {
    // 서버가 이미 캐시된 결과를 내려줬으면 클라이언트가 다시 요청할 필요가 없다.
    if (initialAnalysis) return

    let cancelled = false

    async function run() {
      try {
        const response = await fetch('/api/ai/issue-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, labels, language, repoFullName, issueNumber, issueUpdatedAt }),
        })
        const json = (await response.json()) as ApiResponse<IssueAnalysis>
        if (cancelled) return

        if (!response.ok || !json.ok) {
          if (response.status === 429) {
            setGuideState({ status: 'locked' })
            return
          }
          setGuideState({
            status: 'error',
            message: (!json.ok && json.error?.message) || 'AI 가이드 생성에 실패했습니다.',
          })
          return
        }

        setGuideState({ status: 'done', analysis: json.data })
      } catch {
        if (cancelled) return
        setGuideState({ status: 'error', message: 'AI 가이드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' })
      }
    }

    setGuideState({ status: 'loading' })
    void run()
    return () => {
      cancelled = true
    }
    // 다른 이슈 상세 페이지로 이동하면(issueNumber 변경) 다시 분석해야 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueNumber])

  if (guideState.status !== 'done') {
    return (
      <IssueDetailWorkspace
        overview={<BlockingPanel icon={FileText} label="이슈 개요" state={guideState} />}
        aiGuide={
          <BlockingPanel icon={Sparkles} label="AI 가이드" state={guideState} action={<ContributionGuideDialog />} />
        }
        related={related}
      />
    )
  }

  const { analysis } = guideState

  return (
    <IssueDetailWorkspace
      overview={
        <>
          <IssueOverviewPanel overview={analysis.issueOverview} rawBody={body} />
          <ContributionRulesPanel rules={analysis.contributionRules} insight={analysis.contributionGuideInsight} />
        </>
      }
      aiGuide={<AiGuidePanel analysis={analysis} />}
      related={related}
    />
  )
}
