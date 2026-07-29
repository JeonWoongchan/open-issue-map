'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Brain, FileCode2, Flag, Gauge, Info, Lock, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecommendationSearchingState } from '@/components/dashboard/recommendation/RecommendationSearchingState'
import { redirectToLogin } from '@/lib/client-auth'
import { cn } from '@/lib/utils'
import type { IssueAnalysis } from '@/lib/ai'
import type { ApiResponse } from '@/types/api'
import { ContributionGuideDialog } from './ContributionGuideDialog'
import { DetailPanel } from './DetailPanel'

type AiGuideSectionProps = {
  title: string
  body: string | null
  labels: string[]
  language: string | null
  repoFullName: string
  issueNumber: number
  issueUpdatedAt: string
  // 서버가 이미 DB 캐시에서 찾아 내려준 결과 — 있으면 마운트 시 재요청 없이 바로 렌더링한다.
  initialAnalysis: IssueAnalysis | null
}

const AI_GUIDE_SEARCHING_PHRASES = [
  { text: '이슈 내용을 읽고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:0s]' },
  { text: '필요한 배경 지식을 정리하고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:3s]' },
  { text: '접근 방법을 구상하고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:6s]' },
  { text: '마지막으로 다듬는 중이에요', animationClass: 'recommendation-searching-copy-slow [animation-delay:9s]' },
]
const AI_GUIDE_SEARCHING_FINAL_PHRASE = {
  text: '거의 다 됐어요, 잠시만 기다려 주세요',
  delayClass: '[animation-delay:15s]',
}

const DIFFICULTY_STYLES: Record<IssueAnalysis['difficulty'], string> = {
  쉬움: 'bg-status-success text-status-success-foreground',
  보통: 'bg-status-warning text-status-warning-foreground',
  어려움: 'bg-status-danger text-status-danger-foreground',
}

type RequestState = 'loading' | 'done' | 'locked' | 'error'

// 페이지 진입 시 자동 실행된다(버튼 클릭 불필요) — 게스트는 하루 3개 이슈까지만 실제로 생성되고
// (DB 캐시 히트는 한도를 소모하지 않는다), 초과하면 로그인 유도 상태를 보여준다.
export function AiGuideSection({
  title,
  body,
  labels,
  language,
  repoFullName,
  issueNumber,
  issueUpdatedAt,
  initialAnalysis,
}: AiGuideSectionProps) {
  const [state, setState] = useState<RequestState>(initialAnalysis ? 'done' : 'loading')
  const [analysis, setAnalysis] = useState<IssueAnalysis | null>(initialAnalysis)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
            setState('locked')
            return
          }
          setErrorMessage((!json.ok && json.error?.message) || 'AI 가이드 생성에 실패했습니다.')
          setState('error')
          return
        }

        setAnalysis(json.data)
        setState('done')
      } catch {
        if (cancelled) return
        setErrorMessage('AI 가이드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        setState('error')
      }
    }

    setState('loading')
    void run()
    return () => {
      cancelled = true
    }
    // 다른 이슈 상세 페이지로 이동하면(issueNumber 변경) 다시 분석해야 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueNumber])

  return (
    <DetailPanel icon={Sparkles} label="AI 가이드" action={<ContributionGuideDialog />}>
      {state === 'loading' ? (
        <RecommendationSearchingState
          phrases={AI_GUIDE_SEARCHING_PHRASES}
          finalPhrase={AI_GUIDE_SEARCHING_FINAL_PHRASE}
        />
      ) : state === 'locked' ? (
        <div className="flex items-start gap-4">
          <Lock className="mt-0.5 size-7 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold">오늘의 무료 AI 가이드를 모두 사용했어요</p>
              <p className="mt-1 max-w-[46ch] text-xs text-muted-foreground">
                비로그인 상태에서는 하루 3개 이슈까지 볼 수 있어요. 로그인하면 계속 이용할 수 있어요.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={redirectToLogin}>
              로그인하고 계속 보기
            </Button>
          </div>
        </div>
      ) : state === 'error' ? (
        <p className="text-xs text-status-danger-foreground">{errorMessage}</p>
      ) : analysis ? (
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
      ) : null}
    </DetailPanel>
  )
}
