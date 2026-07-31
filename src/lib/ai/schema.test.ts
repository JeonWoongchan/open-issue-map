import { describe, it, expect } from 'vitest'
import { aiGuideOutputSchema } from '@/lib/ai/schema'

function makeRaw(summarySectionHeading: unknown) {
    return {
        concepts: ['개념1'],
        scope: '작업 범위 설명',
        startingPoints: ['시작 지점'],
        cautions: ['주의사항'],
        expectedBenefit: '기대 효과',
        issueOverview: {
            summary: '한 줄 요약',
            analysis: '상세 분석',
            summarySections: [{ heading: summarySectionHeading, items: ['핵심 내용'] }],
        },
        contributionGuideInsight: {
            commitConventionNote: '커밋 컨벤션 메모',
            claNote: 'CLA 메모',
        },
    }
}

describe('aiGuideOutputSchema', () => {
    describe('issueOverview.summarySections[].heading', () => {
        it('실제 null 값은 그대로 통과시킨다', () => {
            const result = aiGuideOutputSchema.parse(makeRaw(null))
            expect(result.issueOverview.summarySections[0].heading).toBeNull()
        })

        it('일부 모델이 반환하는 문자열 "null"은 실제 null로 정규화한다', () => {
            const result = aiGuideOutputSchema.parse(makeRaw('null'))
            expect(result.issueOverview.summarySections[0].heading).toBeNull()
        })

        it('실제 헤딩 텍스트는 그대로 유지한다', () => {
            const result = aiGuideOutputSchema.parse(makeRaw('버그 요약'))
            expect(result.issueOverview.summarySections[0].heading).toBe('버그 요약')
        })
    })
})
