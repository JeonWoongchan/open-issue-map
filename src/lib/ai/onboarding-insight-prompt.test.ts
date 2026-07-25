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
    it('모든 경험 수준이 라벨+설명으로 포함된다(contribution-levels.ts 기준)', () => {
        const levels = [
            ['beginner', '입문', '오픈소스 기여가 처음이거나'],
            ['junior',   '주니어', '작은 수정이나 문서 기여를'],
            ['mid',      '미들', '기능 구현과 버그 수정까지'],
            ['senior',   '시니어', '구조 설계, 코드 리뷰'],
        ] as const

        for (const [level, label, description] of levels) {
            const result = buildOnboardingInsightPrompt(makeParams({ experienceLevel: level }))
            expect(result).toContain(label)
            expect(result).toContain(description)
        }
    })

    it('모든 목적이 라벨+설명으로 포함된다(contribution-levels.ts 기준)', () => {
        const purposes = [
            ['portfolio', '포트폴리오', '취업이나 이직에'],
            ['growth',    '실력 향상', '단계적으로 성장'],
            ['community', '커뮤니티', '오픈소스 생태계에'],
        ] as const

        for (const [purpose, label, description] of purposes) {
            const result = buildOnboardingInsightPrompt(makeParams({ purpose }))
            expect(result).toContain(label)
            expect(result).toContain(description)
        }
    })

    it('선호 언어를 쉼표로 구분해 포함한다', () => {
        const result = buildOnboardingInsightPrompt(makeParams({ topLanguages: ['TypeScript', 'Python'] }))
        expect(result).toContain('TypeScript, Python')
    })

    it('기여 방식을 contribution-levels.ts 라벨로 변환한다', () => {
        const result = buildOnboardingInsightPrompt(makeParams({ contributionTypes: ['doc', 'feat'] }))
        expect(result).toContain('문서 / 번역')
        expect(result).toContain('기능 구현')
    })

    it('주당 시간을 contribution-levels.ts 라벨(이상/이하 포함)로 표기한다', () => {
        const result = buildOnboardingInsightPrompt(makeParams({ weeklyHours: 10 }))
        expect(result).toContain('주 10시간 이상')
    })

    it('주 2시간은 "이하" 뉘앙스를 포함한다 — 단순 숫자 표기와 달리 임계값 의미가 있다', () => {
        const result = buildOnboardingInsightPrompt(makeParams({ weeklyHours: 2 }))
        expect(result).toContain('주 2시간 이하')
    })
})
