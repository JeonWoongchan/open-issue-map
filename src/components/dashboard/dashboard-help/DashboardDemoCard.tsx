import { HelpDemoCardFrame } from '@/components/help/HelpDemoCardFrame'
import type { DashboardHelpGuideId } from '@/constants/dashboard-help'
import type { HelpGuideInteractionProps } from '@/types/help'
import { DashboardDemoCardFooter } from './DashboardDemoCardFooter'
import { DashboardDemoCardHeader } from './DashboardDemoCardHeader'

type DashboardHelpDemoCardProps = HelpGuideInteractionProps<DashboardHelpGuideId> & {
  demoUpdatedAt: string
}

export function DashboardDemoCard({
  activeGuideId,
  demoUpdatedAt,
  onActivateGuide,
  onClearGuide,
}: DashboardHelpDemoCardProps) {
  return (
    <HelpDemoCardFrame>
      <DashboardDemoCardHeader
        activeGuideId={activeGuideId}
        onActivateGuide={onActivateGuide}
        onClearGuide={onClearGuide}
      />
      <DashboardDemoCardFooter
        activeGuideId={activeGuideId}
        demoUpdatedAt={demoUpdatedAt}
        onActivateGuide={onActivateGuide}
        onClearGuide={onClearGuide}
      />
    </HelpDemoCardFrame>
  )
}
