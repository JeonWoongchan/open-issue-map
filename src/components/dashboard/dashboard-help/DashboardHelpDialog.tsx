'use client'

import { HelpDialogFrame, type ExtraTab } from '@/components/help/HelpDialogFrame'
import { HelpReportFooter } from '@/components/help/HelpReportFooter'
import { useHelpDialog } from '@/hooks/useHelpDialog'
import { useRegisterFloatingHelp } from '@/hooks/useRegisterFloatingHelp'
import {
  DASHBOARD_HELP_DEMO_UPDATED_OFFSET_MS,
  DASHBOARD_HELP_GUIDE_ITEMS,
  type DashboardHelpGuideId,
} from '@/constants/dashboard-help'
import { DashboardDemoCard } from './DashboardDemoCard'

type Props = {
  extraTabs: readonly ExtraTab[]
}

export function DashboardHelpDialog({ extraTabs }: Props) {
  const {
    isOpen,
    activeGuideId,
    demoUpdatedAt,
    openDialog,
    closeDialog,
    activateGuide,
    clearActiveGuide,
  } = useHelpDialog<DashboardHelpGuideId>(DASHBOARD_HELP_DEMO_UPDATED_OFFSET_MS)

  useRegisterFloatingHelp(openDialog)

  return (
    <HelpDialogFrame<DashboardHelpGuideId>
      isOpen={isOpen}
      onCloseAction={closeDialog}
      activeGuideId={activeGuideId}
      demoUpdatedAt={demoUpdatedAt}
      onActivateGuideAction={activateGuide}
      onClearGuideAction={clearActiveGuide}
      guideItems={DASHBOARD_HELP_GUIDE_ITEMS}
      eyebrow="이슈 카드 안내"
      title="카드 구성과 추천 점수 산정 방식"
      titleId="dashboard-help-title"
      descriptionId="dashboard-help-description"
      footer={<HelpReportFooter />}
      renderDemoCardAction={(props) => <DashboardDemoCard {...props} />}
      primaryTabLabel="카드 읽는 법"
      extraTabs={extraTabs}
    />
  )
}
