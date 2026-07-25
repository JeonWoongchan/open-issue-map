import type { ContributionType, ExperienceLevel, Purpose, WeeklyHours } from '@/types/user'

export type AnalysisDifficulty = '쉬움' | '보통' | '어려움'

export interface IssueAnalysis {
    concepts: string[]
    scope: string
    startingPoints: string[]
    cautions: string[]
    difficulty: AnalysisDifficulty
}

export interface IssueAnalysisParams {
    title: string
    body: string | null
    labels: string[]
    language: string | null
    repoFullName: string
    userExperienceLevel: ExperienceLevel
    userPurpose: Purpose
    userWeeklyHours: WeeklyHours
    contributingGuide: string | null
}

export interface OnboardingInsightParams {
    experienceLevel: ExperienceLevel
    topLanguages: string[]
    contributionTypes: ContributionType[]
    weeklyHours: WeeklyHours
    purpose: Purpose
}

export interface OnboardingInsightResult {
    adviceItems: string[]
}

export interface AiProvider {
    analyzeIssue(params: IssueAnalysisParams): Promise<IssueAnalysis>
    generateOnboardingInsight(params: OnboardingInsightParams): Promise<OnboardingInsightResult>
}
