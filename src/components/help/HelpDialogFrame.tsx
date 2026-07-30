'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useHelpDialog } from '@/hooks/useHelpDialog'
import { TabBar } from '@/components/shared/TabBar'
import type { HelpGuideItem } from '@/types/help'
import { HelpGuideList } from './HelpGuideList'
import { HelpHeader } from './HelpHeader'
import { HelpTrigger } from './HelpTrigger'

// 상위 탭 목록의 첫 번째(주 탭)를 가리키는 고정 key — extraTabs의 id와 겹치지 않아야 한다.
const PRIMARY_TAB_KEY = 'primary'

export type ExtraTab = {
    id: string
    label: string
    content: ReactNode
}

// 대시보드·북마크·PR 히스토리 도움말이 공통으로 사용하는 다이얼로그 프레임.
// 트리거 버튼, 오버레이, 헤더, 좌우 2단 그리드(데모 카드 + 가이드 목록)를 통합 관리.
// primaryTabLabel + extraTabs를 모두 전달하면 탭 UI가 활성화된다.
type HelpDialogFrameProps<TGuideId extends string> = {
  demoUpdatedOffsetMs: number
  guideItems: readonly HelpGuideItem<TGuideId>[]
  eyebrow: string
  title: string
  titleId: string
  descriptionId: string
  triggerLabel?: string
  triggerId?: string
  footer?: ReactNode
  // render prop — useHelpDialog 내부 상태(activeGuideId, demoUpdatedAt 등)를
  // 데모 카드에 직접 전달하기 위해 ReactNode 대신 함수로 받음
  renderDemoCardAction: (props: {
    activeGuideId: TGuideId | null
    demoUpdatedAt: string
    onActivateGuide: (guideId: TGuideId) => void
    onClearGuide: () => void
  }) => ReactNode
  primaryTabLabel?: string
  extraTabs?: readonly ExtraTab[]
}

export function HelpDialogFrame<TGuideId extends string>({
  demoUpdatedOffsetMs,
  guideItems,
  eyebrow,
  title,
  titleId,
  descriptionId,
  triggerLabel,
  triggerId,
  footer,
  renderDemoCardAction,
  primaryTabLabel,
  extraTabs,
}: HelpDialogFrameProps<TGuideId>) {
  const {
    isOpen,
    activeGuideId,
    demoUpdatedAt,
    openDialog,
    closeDialog,
    activateGuide,
    clearActiveGuide,
  } = useHelpDialog<TGuideId>(demoUpdatedOffsetMs)

  const [activeTabKey, setActiveTabKey] = useState<string>(PRIMARY_TAB_KEY)

  // 다이얼로그가 닫히면 첫 번째 탭으로 초기화
  useEffect(() => {
    if (!isOpen) setActiveTabKey(PRIMARY_TAB_KEY)
  }, [isOpen])

  const hasTabs =
    primaryTabLabel !== undefined && extraTabs !== undefined && extraTabs.length > 0

  // hasTabs가 참일 때만 extraTabs 접근 — 타입 내로잉 보조
  const activeExtraTabContent =
    hasTabs && activeTabKey !== PRIMARY_TAB_KEY
      ? extraTabs.find((tab) => tab.id === activeTabKey)?.content ?? null
      : null

  return (
    <>
      <HelpTrigger onOpen={openDialog} label={triggerLabel} id={triggerId} />

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm sm:py-6"
          onClick={closeDialog}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="flex max-h-[calc(100svh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:max-h-[calc(100svh-3rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <HelpHeader
              onClose={closeDialog}
              eyebrow={eyebrow}
              title={title}
              titleId={titleId}
              descriptionId={descriptionId}
            />

            {hasTabs ? (
              <div className="px-5 sm:px-6">
                <TabBar
                  tabs={[
                    { key: PRIMARY_TAB_KEY, label: primaryTabLabel },
                    ...extraTabs.map((tab) => ({ key: tab.id, label: tab.label })),
                  ]}
                  active={activeTabKey}
                  onChangeAction={setActiveTabKey}
                />
              </div>
            ) : null}

            {activeExtraTabContent !== null ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                {activeExtraTabContent}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
                <div className="mb-4 shrink-0 lg:mb-0 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-hide">
                  {renderDemoCardAction({
                    activeGuideId,
                    demoUpdatedAt,
                    onActivateGuide: activateGuide,
                    onClearGuide: clearActiveGuide,
                  })}
                </div>
                <div className="-mx-5 overflow-x-auto overscroll-x-contain sm:-mx-6 lg:mx-0 lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-hide">
                  <div className="pl-5 sm:pl-6 lg:pl-0">
                    <HelpGuideList
                      items={guideItems}
                      activeGuideId={activeGuideId}
                      onActivateGuide={activateGuide}
                      onClearGuide={clearActiveGuide}
                    />
                  </div>
                </div>
              </div>
            )}

            {footer ? (
              <div className="border-t border-border/70 bg-muted/20 px-5 py-4 text-sm leading-6 text-muted-foreground sm:px-6">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
