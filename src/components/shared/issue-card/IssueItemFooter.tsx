import { CardMetricsRow } from '@/components/shared/card/CardMetricsRow'
import { BookmarkButton } from './BookmarkButton'
import { IssueExcerpt } from './IssueExcerpt'
import { IssueMetricsRow } from './IssueMetricsRow'
import { IssueTagList } from './IssueTagList'
import type { IssueCardItem } from '@/types/issue'

type IssueItemFooterProps = {
  issue: IssueCardItem
  onToggleBookmark: (issue: IssueCardItem) => Promise<void>
}

export function IssueItemFooter({ issue, onToggleBookmark }: IssueItemFooterProps) {
  return (
    <div className="mt-auto flex flex-col gap-3 text-xs text-muted-foreground">
      <IssueTagList
        difficultyLevel={issue.difficultyLevel}
        labels={issue.labels}
        language={issue.language}
        competitionLevel={issue.competitionLevel}
      />

      <IssueExcerpt body={issue.body} />

      <CardMetricsRow className="justify-between border-t border-border pt-3">
        <IssueMetricsRow commentCount={issue.commentCount} stargazerCount={issue.stargazerCount} />
        <BookmarkButton issue={issue} onToggleBookmarkAction={onToggleBookmark} />
      </CardMetricsRow>
    </div>
  )
}
