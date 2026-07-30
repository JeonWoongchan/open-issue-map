import { HelpHotspot } from '@/components/help/HelpHotspot'
import { CardMetricsRow } from '@/components/shared/card/CardMetricsRow'
import { BookmarkButton } from '@/components/shared/issue-card/BookmarkButton'
import { IssueExcerpt } from '@/components/shared/issue-card/IssueExcerpt'
import { IssueMetricsRow } from '@/components/shared/issue-card/IssueMetricsRow'
import { IssueTagList } from '@/components/shared/issue-card/IssueTagList'
import { DASHBOARD_HELP_DEMO_ISSUE } from '@/constants/dashboard-help'
import type { DashboardHelpGuideId } from '@/constants/dashboard-help'
import type { HelpGuideInteractionProps } from '@/types/help'
import type { IssueCardItem } from '@/types/issue'

type DemoCardFooterProps = HelpGuideInteractionProps<DashboardHelpGuideId>

// BookmarkButton은 IssueCardItem 전체를 받는다 — 데모 이슈는 createdAt/updatedAt을
// 안 쓰므로(카드에 노출되지 않음) 타입만 맞추는 더미 값을 채운다.
const DEMO_CARD_ITEM: IssueCardItem = {
  ...DASHBOARD_HELP_DEMO_ISSUE,
  createdAt: '',
  updatedAt: '',
}

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

      <IssueExcerpt body={DASHBOARD_HELP_DEMO_ISSUE.body} />

      <CardMetricsRow className="justify-between border-t border-border pt-3">
        <HelpHotspot guideId="metrics" {...hotspotProps} className="rounded-xl">
          <IssueMetricsRow
            commentCount={DASHBOARD_HELP_DEMO_ISSUE.commentCount}
            stargazerCount={DASHBOARD_HELP_DEMO_ISSUE.stargazerCount}
          />
        </HelpHotspot>
        {/* 실제로 저장되지 않는 데모용 버튼 — 클릭 시 확인 팝오버는 뜨지만 아무 것도 호출하지 않는다. */}
        <BookmarkButton issue={DEMO_CARD_ITEM} onToggleBookmarkAction={async () => {}} />
      </CardMetricsRow>
    </div>
  )
}
