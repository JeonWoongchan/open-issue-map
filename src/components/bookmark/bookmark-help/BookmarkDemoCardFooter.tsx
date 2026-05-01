import { HelpHotspot } from '@/components/help/HelpHotspot'
import { IssueMetricsRow } from '@/components/shared/issue-card/IssueMetricsRow'
import type { BookmarkHelpGuideId } from '@/constants/bookmark-help'
import { BOOKMARK_HELP_DEMO_ISSUE } from '@/constants/bookmark-help'
import { formatTimeAgo } from '@/utils/format/time-ago'
import type { HelpGuideInteractionProps } from '@/types/help'

type BookmarkDemoCardFooterProps = HelpGuideInteractionProps<BookmarkHelpGuideId> & {
  demoUpdatedAt: string
}

function MissingMetaBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-dashed border-border/80 px-2 py-1 text-[11px] text-muted-foreground/80">
      {label}
    </span>
  )
}

export function BookmarkDemoCardFooter({
  activeGuideId,
  demoUpdatedAt,
  onActivateGuide,
  onClearGuide,
}: BookmarkDemoCardFooterProps) {
  return (
    <div className="mt-auto flex flex-col gap-3 text-xs text-muted-foreground">
      {/* 태그·메트릭스 두 영역이 같은 guideId를 공유 — "missing-github" 설명 하나가 두 구역을 동시에 커버하는 의도적 설계 */}
      <HelpHotspot
        guideId="missing-github"
        activeGuideId={activeGuideId}
        onActivateGuide={onActivateGuide}
        onClearGuide={onClearGuide}
        className="rounded-lg"
      >
        <div className="flex flex-wrap gap-1.5">
          <MissingMetaBadge label="언어 정보 없음" />
          <MissingMetaBadge label="라벨 정보 없음" />
          <MissingMetaBadge label="저장소 상태 없음" />
        </div>
      </HelpHotspot>

      <HelpHotspot
        guideId="missing-github"
        activeGuideId={activeGuideId}
        onActivateGuide={onActivateGuide}
        onClearGuide={onClearGuide}
        className="rounded-lg"
      >
        <IssueMetricsRow
          commentCount={BOOKMARK_HELP_DEMO_ISSUE.commentCount}
          stargazerCount={BOOKMARK_HELP_DEMO_ISSUE.stargazerCount}
        />
      </HelpHotspot>

      <span className="text-interactive-action-hover">{formatTimeAgo(demoUpdatedAt)}</span>
    </div>
  )
}
