'use client'

import { DashboardContributionGuide } from '@/components/dashboard/dashboard-help/DashboardContributionGuide'
import { HelpHeader } from '@/components/help/HelpHeader'
import { HelpTrigger } from '@/components/help/HelpTrigger'
import { useHelpDialog } from '@/hooks/useHelpDialog'

// "접근 순서"는 레포 특화 정보가 아니라 오픈소스 기여의 일반적인 흐름이라, 상세 페이지의 주요
// 섹션으로 두지 않고 이슈 탐색 페이지 도움말과 동일한 콘텐츠(DashboardContributionGuide)를
// 그대로 재사용한 가벼운 도움말 다이얼로그로만 노출한다. 오버레이/패널 마크업은 HelpDialogFrame과
// 같은 스타일을 쓰되, 탭·데모카드가 필요 없어 그 프레임 대신 직접 조립한다.
export function ContributionGuideDialog() {
  const { isOpen, openDialog, closeDialog } = useHelpDialog<string>(0)

  return (
    <>
      <HelpTrigger onOpen={openDialog} label="기여 방법 안내" />

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm sm:py-6"
          onClick={closeDialog}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribution-guide-title"
            aria-describedby="contribution-guide-description"
            className="flex max-h-[calc(100svh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:max-h-[calc(100svh-3rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <HelpHeader
              onClose={closeDialog}
              eyebrow="도움말"
              title="오픈소스 기여 방법"
              titleId="contribution-guide-title"
              descriptionId="contribution-guide-description"
            />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <DashboardContributionGuide />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
