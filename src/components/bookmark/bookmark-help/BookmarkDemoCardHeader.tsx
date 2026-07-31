import { HelpHotspot } from '@/components/help/HelpHotspot'
import { IssueScoreBadge } from '@/components/shared/issue-card/IssueScoreBadge'
import { formatTimeAgo } from '@/utils/format/time-ago'
import { BOOKMARK_HELP_DEMO_ISSUE } from '@/constants/bookmark-help'
import type { BookmarkHelpGuideId } from '@/constants/bookmark-help'
import type { HelpGuideInteractionProps } from '@/types/help'

type BookmarkDemoCardHeaderProps = HelpGuideInteractionProps<BookmarkHelpGuideId> & {
  demoUpdatedAt: string
}

export function BookmarkDemoCardHeader({
  activeGuideId,
  demoUpdatedAt,
  onActivateGuide,
  onClearGuide,
}: BookmarkDemoCardHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="truncate text-xs text-muted-foreground">
            {BOOKMARK_HELP_DEMO_ISSUE.repoFullName}
          </span>
          <HelpHotspot
            guideId="snapshot"
            activeGuideId={activeGuideId}
            onActivateGuide={onActivateGuide}
            onClearGuide={onClearGuide}
            className="w-fit rounded-md"
          >
            <span className="text-[10.5px] text-muted-foreground">
              {formatTimeAgo(demoUpdatedAt)} 북마크함
            </span>
          </HelpHotspot>
        </div>
        {BOOKMARK_HELP_DEMO_ISSUE.score !== null ? (
          <IssueScoreBadge score={BOOKMARK_HELP_DEMO_ISSUE.score} />
        ) : null}
      </div>

      <HelpHotspot
        guideId="check-latest"
        activeGuideId={activeGuideId}
        onActivateGuide={onActivateGuide}
        onClearGuide={onClearGuide}
        className="rounded-lg"
      >
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
          {BOOKMARK_HELP_DEMO_ISSUE.title}
        </h3>
      </HelpHotspot>
    </div>
  )
}
