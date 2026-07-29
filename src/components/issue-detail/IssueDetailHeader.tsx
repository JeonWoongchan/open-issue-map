import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { IssueScoreBadge } from '@/components/shared/issue-card/IssueScoreBadge'
import { IssueTagList } from '@/components/shared/issue-card/IssueTagList'
import type { IssueCardItem } from '@/types/issue'

type IssueDetailHeaderProps = {
  issue: IssueCardItem
}

export function IssueDetailHeader({ issue }: IssueDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="브레드크럼" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/issues" className="hover:text-foreground">
          이슈 탐색
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="truncate">{issue.repoFullName}</span>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span>#{issue.number}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <h1 className="min-w-0 text-xl font-semibold leading-snug text-foreground">{issue.title}</h1>
        {issue.score !== null ? <IssueScoreBadge score={issue.score} size="lg" className="shrink-0" /> : null}
      </div>

      <IssueTagList
        difficultyLevel={issue.difficultyLevel}
        labels={issue.labels}
        language={issue.language}
        competitionLevel={issue.competitionLevel}
      />
    </div>
  )
}
