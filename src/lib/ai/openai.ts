import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import type { AiGuideOutput, AiProvider, IssueAnalysisParams } from './types'
import { cleanIssueBody } from './preprocess'
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from './prompt'
import { aiGuideOutputSchema } from './schema'

const OPENAI_MODEL = 'gpt-5.6-luna'

// OpenAI Structured Outputs(strict json_schema)는 minLength/minItems 같은 길이 제약 키워드가
// 스키마에 있으면 요청 자체를 400으로 거부한다 — aiGuideOutputSchema(schema.ts)의 min()/max()를
// 그대로 zodResponseFormat에 넘기면 API 호출이 실패한다. 그래서 여기서는 키·타입·enum·중첩 구조만
// 강제하는 별도의 "wire" 스키마로 응답 형식을 받고, 길이 등 세부 제약은 기존과 동일하게
// aiGuideOutputSchema.parse()로 응답을 받은 뒤 검증한다.
const issueBodySectionWireSchema = z.object({
    heading: z.string().nullable(),
    items: z.array(z.string()),
})

const aiGuideOutputWireSchema = z.object({
    concepts: z.array(z.string()),
    scope: z.string(),
    startingPoints: z.array(z.string()),
    cautions: z.array(z.string()),
    difficulty: z.enum(['쉬움', '보통', '어려움']),
    expectedBenefit: z.string(),
    issueOverview: z.object({
        summary: z.string(),
        analysis: z.string(),
        summarySections: z.array(issueBodySectionWireSchema),
    }),
    contributionGuideInsight: z.object({
        commitConventionNote: z.string(),
        claNote: z.string(),
    }),
})

export class OpenAiProvider implements AiProvider {
    private readonly client: OpenAI

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey })
    }

    async analyzeIssue(params: IssueAnalysisParams): Promise<AiGuideOutput> {
        const cleanedBody = cleanIssueBody(params.body)
        const userPrompt = buildAnalysisPrompt({ ...params, body: cleanedBody })

        const completion = await this.client.chat.completions.parse({
            model: OPENAI_MODEL,
            messages: [
                { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            response_format: zodResponseFormat(aiGuideOutputWireSchema, 'issue_analysis'),
        })

        const raw: unknown = completion.choices[0]?.message.parsed
        return aiGuideOutputSchema.parse(raw)
    }
}
