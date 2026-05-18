import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import type { AiProvider, IssueAnalysis, IssueAnalysisParams } from './types'
import { cleanIssueBody } from './preprocess'
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from './prompt'

const GEMINI_MODEL = 'gemini-3.1-flash-lite'

// Gemini 응답을 IssueAnalysis로 좁히는 스키마 — 외부 데이터이므로 런타임 검증 필수
const issueAnalysisSchema = z.object({
    concepts: z.array(z.string()).min(1),
    scope: z.string().min(1),
    startingPoints: z.array(z.string()).min(1),
    cautions: z.array(z.string()),
    difficulty: z.enum(['쉬움', '보통', '어려움']),
})

export class GeminiProvider implements AiProvider {
    private readonly client: GoogleGenAI

    constructor(apiKey: string) {
        this.client = new GoogleGenAI({ apiKey })
    }

    async analyzeIssue(params: IssueAnalysisParams): Promise<IssueAnalysis> {
        const cleanedBody = cleanIssueBody(params.body)
        const userPrompt = buildAnalysisPrompt({ ...params, body: cleanedBody })

        const response = await this.client.models.generateContent({
            model: GEMINI_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction: ANALYSIS_SYSTEM_PROMPT,
                responseMimeType: 'application/json',
            },
        })

        const raw: unknown = JSON.parse(response.text ?? '')
        return issueAnalysisSchema.parse(raw)
    }
}
