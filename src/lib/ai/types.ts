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
}

export interface AiProvider {
    analyzeIssue(params: IssueAnalysisParams): Promise<IssueAnalysis>
}
