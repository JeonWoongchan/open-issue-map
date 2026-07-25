import { HelpHotspot } from '@/components/help/HelpHotspot'
import { IssueScoreBadge } from '@/components/shared/issue-card/IssueScoreBadge'
import { formatTimeAgo } from '@/utils/format/time-ago'
import { DASHBOARD_HELP_DEMO_ISSUE } from '@/constants/dashboard-help'
import type { DashboardHelpGuideId } from '@/constants/dashboard-help'
import type { HelpGuideInteractionProps } from '@/types/help'

type DashboardDemoCardHeaderProps = HelpGuideInteractionProps<DashboardHelpGuideId> & {
  demoUpdatedAt: string
}

export function DashboardDemoCardHeader({
  activeGuideId,
  demoUpdatedAt,
  onActivateGuide,
  onClearGuide,
}: DashboardDemoCardHeaderProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="truncate text-xs text-muted-foreground">
            {DASHBOARD_HELP_DEMO_ISSUE.repoFullName}
          </span>
          <span className="text-[10.5px] text-muted-foreground">{formatTimeAgo(demoUpdatedAt)}</span>
        </div>
        <HelpHotspot
          guideId="score"
          activeGuideId={activeGuideId}
          onActivateGuide={onActivateGuide}
          onClearGuide={onClearGuide}
          className="rounded-lg"
        >
          <IssueScoreBadge score={DASHBOARD_HELP_DEMO_ISSUE.score} />
        </HelpHotspot>
      </div>

      <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
        {DASHBOARD_HELP_DEMO_ISSUE.title}
      </h3>
    </>
  )
}
