import { describe, it, expect } from 'vitest'
import { buildOnboardingInsightPrompt } from '@/lib/ai/onboarding-insight-prompt'
import type { OnboardingInsightParams } from '@/lib/ai/types'

function makeParams(overrides: Partial<OnboardingInsightParams> = {}): OnboardingInsightParams {
    return {
        experienceLevel: 'junior',
        topLanguages: ['TypeScript'],
        contributionTypes: ['bug'],
        weeklyHours: 5,
        purpose: 'portfolio',
        ...overrides,
    }
}

describe('buildOnboardingInsightPrompt', () => {
    it('모든 경험 수준 레이블이 올바르게 매핑된다', () => {
        const levels = [
            ['beginner', '입문'],
            ['junior',   '초급'],
            ['mid',      '중급'],
            ['senior',   '고급'],
        ] as const

        for (const [level, label] of levels) {
            const result = buildOnboardingInsightPrompt(makeParams({ experienceLevel: level }))
            expect(result).toContain(label)
        }
    })

    it('모든 목적 레이블이 올바르게 매핑된다', () => {
        const purposes = [
            ['portfolio', '포트폴리오 구축'],
            ['growth',    '실력 향상'],
            ['community', '커뮤니티 기여'],
        ] as const

        for (const [purpose, label] of purposes) {
            const result = buildOnboardingInsightPrompt(makeParams({ purpose }))
            expect(result).toContain(label)
        }
    })

    it('선호 언어를 쉼표로 구분해 포함한다', () => {
        const result = buildOnboardingInsightPrompt(makeParams({ topLanguages: ['TypeScript', 'Python'] }))
        expect(result).toContain('TypeScript, Python')
    })

    it('기여 방식을 한국어 레이블로 변환한다', () => {
        const result = buildOnboardingInsightPrompt(makeParams({ contributionTypes: ['doc', 'feat'] }))
        expect(result).toContain('문서, 기능 개발')
    })

    it('주당 시간을 포함한다', () => {
        const result = buildOnboardingInsightPrompt(makeParams({ weeklyHours: 10 }))
        expect(result).toContain('10시간')
    })
})
