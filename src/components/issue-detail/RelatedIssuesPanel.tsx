import Link from 'next/link'
import { ArrowRight, GitPullRequestArrow } from 'lucide-react'
import { DetailPanel } from './DetailPanel'
import { formatTimeAgo } from '@/utils/format/time-ago'
import type { RawIssue } from '@/types/issue'

type RelatedIssuesPanelProps = {
  issues: RawIssue[]
}

// findskill의 "Related" 리스트 패턴 재사용 — 화살표가 hover 시 우측으로 이동한다.
export function RelatedIssuesPanel({ issues }: RelatedIssuesPanelProps) {
  return (
    <DetailPanel icon={GitPullRequestArrow} label="이 저장소의 다른 이슈">
      {issues.length === 0 ? (
        <p className="text-xs text-muted-foreground">지금은 조건에 맞는 다른 이슈가 없어요.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {issues.map((issue) => (
            <li key={issue.url}>
              <Link
                href={`/issues/${issue.repository.nameWithOwner}/${issue.number}`}
                className="group flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 truncate text-foreground">{issue.title}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {formatTimeAgo(issue.updatedAt)}
                  <ArrowRight className="size-3.5 -translate-x-0.5 text-interactive-action opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DetailPanel>
  )
}
