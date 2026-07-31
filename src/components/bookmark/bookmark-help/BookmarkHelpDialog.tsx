'use client'

import { HelpDialogFrame } from '@/components/help/HelpDialogFrame'
import { HelpReportFooter } from '@/components/help/HelpReportFooter'
import { useHelpDialog } from '@/hooks/useHelpDialog'
import { useRegisterFloatingHelp } from '@/hooks/useRegisterFloatingHelp'
import {
  BOOKMARK_HELP_DEMO_UPDATED_OFFSET_MS,
  BOOKMARK_HELP_GUIDE_ITEMS,
  type BookmarkHelpGuideId,
} from '@/constants/bookmark-help'
import { BookmarkDemoCard } from './BookmarkDemoCard'

export function BookmarkHelpDialog() {
  const {
    isOpen,
    activeGuideId,
    demoUpdatedAt,
    openDialog,
    closeDialog,
    activateGuide,
    clearActiveGuide,
  } = useHelpDialog<BookmarkHelpGuideId>(BOOKMARK_HELP_DEMO_UPDATED_OFFSET_MS)

  useRegisterFloatingHelp(openDialog)

  return (
    <HelpDialogFrame<BookmarkHelpGuideId>
      isOpen={isOpen}
      onCloseAction={closeDialog}
      activeGuideId={activeGuideId}
      demoUpdatedAt={demoUpdatedAt}
      onActivateGuideAction={activateGuide}
      onClearGuideAction={clearActiveGuide}
      guideItems={BOOKMARK_HELP_GUIDE_ITEMS}
      eyebrow="도움말"
      title="Q. 북마크 카드의 정보는 언제 기준인가요?"
      titleId="bookmark-help-title"
      descriptionId="bookmark-help-description"
      footer={<HelpReportFooter />}
      renderDemoCardAction={(props) => <BookmarkDemoCard {...props} />}
    />
  )
}
