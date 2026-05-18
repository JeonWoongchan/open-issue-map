import { GeminiProvider } from './gemini'
import type { AiProvider } from './types'

export type { AiProvider, IssueAnalysis, IssueAnalysisParams, AnalysisDifficulty } from './types'

// 모듈 수준 싱글턴 — 요청마다 GoogleGenAI 인스턴스를 재생성하지 않는다.
let _provider: AiProvider | null = null

export function createAiProvider(): AiProvider {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
    if (!_provider) _provider = new GeminiProvider(apiKey)
    return _provider
}
