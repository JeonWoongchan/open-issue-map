'use client'

import { HelpDialogFrame } from '@/components/help/HelpDialogFrame'
import { HelpReportFooter } from '@/components/help/HelpReportFooter'
import { useHelpDialog } from '@/hooks/useHelpDialog'
import { useRegisterFloatingHelp } from '@/hooks/useRegisterFloatingHelp'
import {
    PR_HISTORY_HELP_DEMO_OFFSET_MS,
    PR_HISTORY_HELP_GUIDE_ITEMS,
    type PRHistoryHelpGuideId,
} from '@/constants/pr-history-help'
import { PRHistoryDemoCard } from './PRHistoryDemoCard'

export function PRHistoryHelpDialog() {
    const {
        isOpen,
        activeGuideId,
        demoUpdatedAt,
        openDialog,
        closeDialog,
        activateGuide,
        clearActiveGuide,
    } = useHelpDialog<PRHistoryHelpGuideId>(PR_HISTORY_HELP_DEMO_OFFSET_MS)

    useRegisterFloatingHelp(openDialog)

    return (
        <HelpDialogFrame<PRHistoryHelpGuideId>
            isOpen={isOpen}
            onCloseAction={closeDialog}
            activeGuideId={activeGuideId}
            demoUpdatedAt={demoUpdatedAt}
            onActivateGuideAction={activateGuide}
            onClearGuideAction={clearActiveGuide}
            guideItems={PR_HISTORY_HELP_GUIDE_ITEMS}
            eyebrow="카드 읽는 법"
            title="Q. PR 카드의 요소는 무엇을 의미하나요?"
            titleId="pr-history-help-title"
            descriptionId="pr-history-help-description"
            footer={<HelpReportFooter />}
            renderDemoCardAction={(props) => <PRHistoryDemoCard {...props} />}
        />
    )
}
