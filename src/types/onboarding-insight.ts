export type OnboardingInsightStatus = 'success' | 'failed'

export interface OnboardingInsight {
  status: OnboardingInsightStatus
  adviceItems: string[] | null
}
