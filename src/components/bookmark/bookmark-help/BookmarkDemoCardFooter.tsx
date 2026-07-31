import { HelpHotspot } from '@/components/help/HelpHotspot'
import { IssueExcerpt } from '@/components/shared/issue-card/IssueExcerpt'
import { IssueMetricsRow } from '@/components/shared/issue-card/IssueMetricsRow'
import { IssueTagList } from '@/components/shared/issue-card/IssueTagList'
import type { BookmarkHelpGuideId } from '@/constants/bookmark-help'
import { BOOKMARK_HELP_DEMO_ISSUE } from '@/constants/bookmark-help'
import type { HelpGuideInteractionProps } from '@/types/help'

type BookmarkDemoCardFooterProps = HelpGuideInteractionProps<BookmarkHelpGuideId>

export function BookmarkDemoCardFooter({
  activeGuideId,
  onActivateGuide,
  onClearGuide,
}: BookmarkDemoCardFooterProps) {
  const hotspotProps = { activeGuideId, onActivateGuide, onClearGuide }

  return (
    <div className="mt-auto flex flex-col gap-3 text-xs text-muted-foreground">
      {/* 태그·메트릭스 두 영역이 같은 guideId를 공유 — "이 값들은 북마크 시점 값"이라는
          설명 하나가 두 구역을 동시에 커버하는 의도적 설계 */}
      <HelpHotspot guideId="snapshot" {...hotspotProps} className="rounded-xl">
        <IssueTagList
          difficultyLevel={BOOKMARK_HELP_DEMO_ISSUE.difficultyLevel}
          labels={BOOKMARK_HELP_DEMO_ISSUE.labels}
          language={BOOKMARK_HELP_DEMO_ISSUE.language}
          competitionLevel={BOOKMARK_HELP_DEMO_ISSUE.competitionLevel}
        />
      </HelpHotspot>

      <IssueExcerpt body={BOOKMARK_HELP_DEMO_ISSUE.body} />

      <HelpHotspot guideId="snapshot" {...hotspotProps} className="rounded-xl">
        <IssueMetricsRow
          commentCount={BOOKMARK_HELP_DEMO_ISSUE.commentCount}
          stargazerCount={BOOKMARK_HELP_DEMO_ISSUE.stargazerCount}
        />
      </HelpHotspot>
    </div>
  )
}
