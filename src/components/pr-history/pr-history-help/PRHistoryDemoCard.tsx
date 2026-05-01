import { HelpDemoCardFrame } from '@/components/help/HelpDemoCardFrame'
import type { PRHistoryHelpGuideId } from '@/constants/pr-history-help'
import type { HelpGuideInteractionProps } from '@/types/help'
import { PRHistoryDemoCardFooter } from './PRHistoryDemoCardFooter'
import { PRHistoryDemoCardHeader } from './PRHistoryDemoCardHeader'

type PRHistoryDemoCardProps = HelpGuideInteractionProps<PRHistoryHelpGuideId> & {
    demoUpdatedAt: string
}

export function PRHistoryDemoCard({
    activeGuideId,
    demoUpdatedAt,
    onActivateGuide,
    onClearGuide,
}: PRHistoryDemoCardProps) {
    return (
        <HelpDemoCardFrame label="예시 PR 카드">
            <PRHistoryDemoCardHeader
                activeGuideId={activeGuideId}
                onActivateGuide={onActivateGuide}
                onClearGuide={onClearGuide}
            />
            <PRHistoryDemoCardFooter
                activeGuideId={activeGuideId}
                demoUpdatedAt={demoUpdatedAt}
                onActivateGuide={onActivateGuide}
                onClearGuide={onClearGuide}
            />
        </HelpDemoCardFrame>
    )
}
