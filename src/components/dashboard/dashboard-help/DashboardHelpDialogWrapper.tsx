import { type ExtraTab } from '@/components/help/HelpDialogFrame'
import { DashboardHelpDialog } from './DashboardHelpDialog'
import { DashboardScoringGuide } from './DashboardScoringGuide'
import { DashboardAIGuide } from './DashboardAIGuide'
import { DashboardContributionGuide } from './DashboardContributionGuide'

const EXTRA_TABS: readonly ExtraTab[] = [
    { id: 'scoring', label: '점수 산정 방식', content: <DashboardScoringGuide /> },
    { id: 'ai-guide', label: 'AI 분석 방식', content: <DashboardAIGuide /> },
    { id: 'contribution', label: '기여 가이드', content: <DashboardContributionGuide /> },
]

export function DashboardHelpDialogWrapper() {
    return <DashboardHelpDialog extraTabs={EXTRA_TABS} />
}
