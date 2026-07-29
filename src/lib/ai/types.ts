import type { ExperienceLevel, Purpose, WeeklyHours } from '@/types/user'
import type { AiGuideOutput } from './schema'

// AI 응답 관련 타입(AiGuideOutput/IssueAnalysis/IssueOverview/IssueBodySection/
// ContributionGuideInsight/AnalysisDifficulty)은 zod 스키마(./schema)에서 z.infer로 파생한다 —
// 손으로 쓴 interface와 이중 관리하면 필드 추가·변경 시 둘 다 고쳐야 하고 누락돼도 컴파일 에러가
// 안 나는 조합이 생긴다. 여기서는 스키마로 검증되지 않는 입력 타입(IssueAnalysisParams)과
// 프로바이더 인터페이스만 정의한다.
export type {
    AiGuideOutput,
    IssueAnalysis,
    IssueOverview,
    IssueBodySection,
    ContributionGuideInsight,
    AnalysisDifficulty,
} from './schema'

export interface IssueAnalysisParams {
    title: string
    body: string | null
    labels: string[]
    language: string | null
    repoFullName: string
    userExperienceLevel: ExperienceLevel
    userPurpose: Purpose
    userWeeklyHours: WeeklyHours
    readme: string | null
    contributingGuideText: string | null
}

export interface AiProvider {
    analyzeIssue(params: IssueAnalysisParams): Promise<AiGuideOutput>
}
