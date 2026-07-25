import { CardHeaderLayout } from '@/components/shared/card/CardHeaderLayout'
import { formatTimeAgo } from '@/utils/format/time-ago'
import { IssueScoreBadge } from './IssueScoreBadge'
import type { IssueCardItem } from '@/types/issue'

type IssueItemHeaderProps = {
  issue: IssueCardItem
}

export function IssueItemHeader({ issue }: IssueItemHeaderProps) {
  return (
    <CardHeaderLayout
      topLeft={
        <div className="flex flex-col gap-1">
          <span className="block truncate text-xs text-muted-foreground">{issue.repoFullName}</span>
          <span className="text-[10.5px] text-muted-foreground">{formatTimeAgo(issue.updatedAt)}</span>
        </div>
      }
      topRight={
        issue.score !== null ? (
          <IssueScoreBadge score={issue.score} scoreBreakdown={issue.scoreBreakdown} />
        ) : null
      }
      title={
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
          {issue.title}
        </h3>
      }
    />
  )
}
