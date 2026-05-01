import { GitPullRequest } from 'lucide-react'
import { HelpHotspot } from '@/components/help/HelpHotspot'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PR_HISTORY_HELP_DEMO_PR } from '@/constants/pr-history-help'
import type { PRHistoryHelpGuideId } from '@/constants/pr-history-help'
import type { HelpGuideInteractionProps } from '@/types/help'

// PRCardHeader의 STATE_META와 동일한 정의 — 데모 카드 전용 로컬 복사본
const STATE_META = {
    OPEN: { label: '진행 중', className: 'border-brand-subtle-border bg-interactive-action text-interactive-action-foreground' },
    MERGED: { label: '병합됨', className: 'border-status-success-border bg-status-success text-status-success-foreground' },
    CLOSED: { label: '닫힘', className: 'border-status-danger-border bg-status-danger text-status-danger-foreground' },
} as const

type PRHistoryDemoCardHeaderProps = HelpGuideInteractionProps<PRHistoryHelpGuideId>

export function PRHistoryDemoCardHeader({
    activeGuideId,
    onActivateGuide,
    onClearGuide,
}: PRHistoryDemoCardHeaderProps) {
    const stateMeta = STATE_META[PR_HISTORY_HELP_DEMO_PR.state]

    return (
        <>
            <div className="flex items-start justify-between gap-3">
                <span className="truncate text-xs text-muted-foreground">
                    {PR_HISTORY_HELP_DEMO_PR.repoFullName}
                </span>
                <HelpHotspot
                    guideId="state"
                    activeGuideId={activeGuideId}
                    onActivateGuide={onActivateGuide}
                    onClearGuide={onClearGuide}
                    className="rounded-md"
                >
                    <Badge variant="outline" className={cn('rounded-md', stateMeta.className)}>
                        {stateMeta.label}
                    </Badge>
                </HelpHotspot>
            </div>

            <h3 className="line-clamp-2 flex items-center gap-1.5 text-sm font-medium leading-snug text-card-foreground">
                <GitPullRequest className="size-4 shrink-0" />
                {PR_HISTORY_HELP_DEMO_PR.title}
            </h3>
        </>
    )
}
