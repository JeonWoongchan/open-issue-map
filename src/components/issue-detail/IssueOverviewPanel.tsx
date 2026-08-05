'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { FileText } from 'lucide-react'
import { DetailPanel, DetailPanelNotice } from './DetailPanel'
import { TabBar } from '@/components/shared/TabBar'
import { cn } from '@/lib/utils'
import type { IssueOverview } from '@/lib/ai'

// react-markdown·remark-gfm(약 40KB)은 "본문 전체" 탭을 열 때만 필요하므로 next/dynamic으로
// 분리한다 — 기본 탭은 "이슈 본문 요약"이라 대부분의 방문에서 이 청크 자체를 받아오지 않는다.
const IssueBodyMarkdown = dynamic(
  () => import('./IssueBodyMarkdown').then((mod) => mod.IssueBodyMarkdown),
  {
    ssr: false,
    loading: () => <p className="mt-2.5 text-sm text-muted-foreground">불러오는 중...</p>,
  },
)

type IssueOverviewPanelProps = {
  overview: IssueOverview
  rawBody: string | null
}

type BodyTab = 'summary' | 'full'

const BODY_TABS: { key: BodyTab; label: string }[] = [
  { key: 'summary', label: '이슈 본문 요약' },
  { key: 'full', label: '본문 전체' },
]

// 이슈가 무엇을 말하는지 AI가 해석한 요약·분석을 보여주고, 그 아래 "이슈 본문 요약"(AI가 원문
// 섹션 구조를 살려 압축한 요약) / "본문 전체"(GitHub 원문을 마크다운으로 렌더링, AI 미개입) 두 탭으로 나눠 둔다.
export function IssueOverviewPanel({ overview, rawBody }: IssueOverviewPanelProps) {
  const [bodyTab, setBodyTab] = useState<BodyTab>('summary')

  return (
    <DetailPanel icon={FileText} label="이슈 개요">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0">
          <p className="break-words break-keep text-pretty text-sm font-bold text-foreground">{overview.summary}</p>
          <p className="mt-1.5 whitespace-pre-wrap break-words break-keep text-pretty text-sm leading-relaxed text-muted-foreground">
            {overview.analysis}
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-border p-3.5">
          <TabBar tabs={BODY_TABS} active={bodyTab} onChangeAction={setBodyTab} variant="pill" />

          {bodyTab === 'summary' ? (
            <div className="mt-2.5 flex min-w-0 flex-col gap-3">
              {overview.summarySections.map((section, index) => (
                <div key={index} className="min-w-0">
                  {/* 원문에 실제 헤딩이 없으면 AI가 heading을 null로 준다 — 매직 스트링이 아니라 타입으로 표현 */}
                  {section.heading !== null ? (
                    <p className="break-words break-keep text-pretty text-sm font-semibold text-foreground">
                      {section.heading}
                    </p>
                  ) : null}
                  <ul className={cn('flex flex-col gap-1', section.heading !== null && 'mt-1')}>
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex min-w-0 items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                        <span className="min-w-0 break-words break-keep text-pretty">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : rawBody ? (
            <div className="mt-2.5">
              <IssueBodyMarkdown body={rawBody} />
            </div>
          ) : (
            <p className="mt-2.5 text-sm text-muted-foreground">이슈 본문이 없습니다.</p>
          )}
        </div>

        <DetailPanelNotice>
          이슈 본문 요약은 AI가 정리한 결과예요. 참고용이니 기여 전 반드시 이슈 원본을 확인해 주세요.
        </DetailPanelNotice>
      </div>
    </DetailPanel>
  )
}
