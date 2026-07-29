import { GoogleGenAI } from '@google/genai'
import type { AiGuideOutput, AiProvider, IssueAnalysisParams } from './types'
import { cleanIssueBody } from './preprocess'
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from './prompt'
import { aiGuideOutputSchema } from './schema'

const GEMINI_MODEL = 'gemini-3.1-flash-lite'

export class GeminiProvider implements AiProvider {
    private readonly client: GoogleGenAI

    constructor(apiKey: string) {
        this.client = new GoogleGenAI({ apiKey })
    }

    async analyzeIssue(params: IssueAnalysisParams): Promise<AiGuideOutput> {
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
        return aiGuideOutputSchema.parse(raw)
    }
}
