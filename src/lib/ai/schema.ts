import { z } from 'zod'

const issueBodySectionSchema = z.object({
    // 원문에 실제 헤딩이 없는 단순 본문이면 null — 매직 스트링(예: "본문")으로 흉내내지 않는다.
    // OpenAI 모델이 프롬프트 지시에도 불구하고 실제 null 대신 문자열 "null"을 반환하는 경우가
    // 실측으로 확인돼(같은 프롬프트로도 확률적으로 재현됨), 검증 전에 정규화한다.
    heading: z.string().min(1).nullable().transform((val) => (val === 'null' ? null : val)),
    items: z.array(z.string().min(1)).min(1),
})

// AI 응답을 AiGuideOutput으로 좁히는 스키마 — 외부 데이터이므로 런타임 검증 필수
export const aiGuideOutputSchema = z.object({
    concepts: z.array(z.string()).min(1).max(4),
    scope: z.string().min(1),
    startingPoints: z.array(z.string()).min(1).max(3),
    cautions: z.array(z.string()).min(1).max(3),
    difficulty: z.enum(['쉬움', '보통', '어려움']),
    expectedBenefit: z.string().min(1),
    issueOverview: z.object({
        summary: z.string().min(1),
        analysis: z.string().min(1),
        summarySections: z.array(issueBodySectionSchema).min(1),
    }),
    contributionGuideInsight: z.object({
        commitConventionNote: z.string().min(1),
        claNote: z.string().min(1),
    }),
})

// DB에 캐싱된 JSONB를 신뢰하기 전 검증용 — 응답 스키마가 바뀌면 이전에 저장된 캐시 행이
// 새 타입과 어긋날 수 있어(issue-guide-cache.ts), 여기서 걸러내지 않으면 클라이언트가
// undefined 필드를 그대로 렌더링하다 크래시한다.
export const issueAnalysisSchema = aiGuideOutputSchema.extend({
    contributionRules: z.object({
        contributingGuidePath: z.string().nullable(),
        pullRequestTemplatePath: z.string().nullable(),
    }),
})

// zod 스키마를 단일 출처로 두고 타입은 여기서 파생한다 — 손으로 쓴 interface와 이중 관리하지 않는다.
export type IssueBodySection = z.infer<typeof issueBodySectionSchema>
export type AiGuideOutput = z.infer<typeof aiGuideOutputSchema>
export type IssueAnalysis = z.infer<typeof issueAnalysisSchema>
export type AnalysisDifficulty = AiGuideOutput['difficulty']
export type IssueOverview = AiGuideOutput['issueOverview']
export type ContributionGuideInsight = AiGuideOutput['contributionGuideInsight']
