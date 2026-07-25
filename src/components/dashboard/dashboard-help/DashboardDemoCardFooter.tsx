import { HelpHotspot } from '@/components/help/HelpHotspot'
import { IssueMetricsRow } from '@/components/shared/issue-card/IssueMetricsRow'
import { IssueTagList } from '@/components/shared/issue-card/IssueTagList'
import { DASHBOARD_HELP_DEMO_ISSUE } from '@/constants/dashboard-help'
import type { DashboardHelpGuideId } from '@/constants/dashboard-help'
import type { HelpGuideInteractionProps } from '@/types/help'

type DemoCardFooterProps = HelpGuideInteractionProps<DashboardHelpGuideId>

// IssueItemFooter와 병렬 구현 — 레이아웃 변경 시 두 파일을 함께 수정한다.
export function DashboardDemoCardFooter({
  activeGuideId,
  onActivateGuide,
  onClearGuide,
}: DemoCardFooterProps) {
  const hotspotProps = { activeGuideId, onActivateGuide, onClearGuide }

  return (
    <div className="mt-auto flex flex-col gap-3 text-xs text-muted-foreground">
      <HelpHotspot guideId="stack" {...hotspotProps} className="rounded-xl">
        <IssueTagList
          difficultyLevel={DASHBOARD_HELP_DEMO_ISSUE.difficultyLevel}
          labels={DASHBOARD_HELP_DEMO_ISSUE.labels}
          language={DASHBOARD_HELP_DEMO_ISSUE.language}
          competitionLevel={DASHBOARD_HELP_DEMO_ISSUE.competitionLevel}
        />
      </HelpHotspot>

      <HelpHotspot guideId="metrics" {...hotspotProps} className="rounded-xl border-t border-border pt-3">
        <IssueMetricsRow
          commentCount={DASHBOARD_HELP_DEMO_ISSUE.commentCount}
          stargazerCount={DASHBOARD_HELP_DEMO_ISSUE.stargazerCount}
        />
      </HelpHotspot>
    </div>
  )
}
