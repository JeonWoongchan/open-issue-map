export type AnalysisDifficulty = '쉬움' | '보통' | '어려움'

export interface IssueAnalysis {
    concepts: string[]
    scope: string
    startingPoints: string[]
    cautions: string[]
    difficulty: AnalysisDifficulty
}

import type { ExperienceLevel, Purpose, WeeklyHours } from '@/types/user'

export interface IssueAnalysisParams {
    title: string
    body: string | null
    labels: string[]
    language: string | null
    repoFullName: string
    // 개인화된 난이도 판단에 사용하는 사용자 컨텍스트
    userExperienceLevel: ExperienceLevel
    userPurpose: Purpose
    userWeeklyHours: WeeklyHours
    // 저장소 기여 가이드 — 없으면 null
    contributingGuide: string | null
}

export interface AiProvider {
    analyzeIssue(params: IssueAnalysisParams): Promise<IssueAnalysis>
}
