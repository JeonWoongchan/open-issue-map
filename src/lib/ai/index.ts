import { OpenAiProvider } from './openai'
import type { AiProvider } from './types'

export type {
    AiProvider,
    AiGuideOutput,
    IssueAnalysis,
    IssueAnalysisParams,
    IssueOverview,
    ContributionGuideInsight,
} from './types'

// 모듈 수준 싱글턴 — 같은 워커 인스턴스 내에서 OpenAI 클라이언트 재생성을 방지한다
let _provider: AiProvider | null = null

export function createAiProvider(): AiProvider {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.')
    if (!_provider) _provider = new OpenAiProvider(apiKey)
    return _provider
}
