import { describe, it, expect } from 'vitest'
import { buildAnalysisPrompt } from '@/lib/ai/prompt'
import type { IssueAnalysisParams } from '@/lib/ai/types'

function makeParams(overrides: Partial<IssueAnalysisParams> = {}): IssueAnalysisParams {
    return {
        title: 'Fix login bug',
        body: 'The button does not work.',
        labels: ['bug'],
        language: 'TypeScript',
        repoFullName: 'owner/repo',
        userExperienceLevel: 'junior',
        userPurpose: 'portfolio',
        userWeeklyHours: 5,
        contributingGuide: null,
        ...overrides,
    }
}

describe('buildAnalysisPrompt', () => {
    describe('기여자 정보 섹션', () => {
        it('경험 수준을 한국어 레이블로 변환한다', () => {
            const result = buildAnalysisPrompt(makeParams({ userExperienceLevel: 'beginner' }))
            expect(result).toContain('입문 (처음 오픈소스 기여)')
        })

        it('기여 목적을 한국어 레이블로 변환한다', () => {
            const result = buildAnalysisPrompt(makeParams({ userPurpose: 'growth' }))
            expect(result).toContain('실력 향상')
        })

        it('주당 시간을 포함한다', () => {
            const result = buildAnalysisPrompt(makeParams({ userWeeklyHours: 10 }))
            expect(result).toContain('10시간')
        })

        it('모든 경험 수준 레이블이 올바르게 매핑된다', () => {
            const levels = [
                ['beginner', '입문'],
                ['junior',   '초급'],
                ['mid',      '중급'],
                ['senior',   '고급'],
            ] as const

            for (const [level, label] of levels) {
                const result = buildAnalysisPrompt(makeParams({ userExperienceLevel: level }))
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
                const result = buildAnalysisPrompt(makeParams({ userPurpose: purpose }))
                expect(result).toContain(label)
            }
        })
    })

    describe('이슈 정보 섹션', () => {
        it('저장소명과 제목은 항상 포함된다', () => {
            const result = buildAnalysisPrompt(makeParams())
            expect(result).toContain('owner/repo')
            expect(result).toContain('Fix login bug')
        })

        it('language가 있으면 주요 언어를 포함한다', () => {
            const result = buildAnalysisPrompt(makeParams({ language: 'Python' }))
            expect(result).toContain('주요 언어: Python')
        })

        it('language가 null이면 주요 언어 줄을 생략한다', () => {
            const result = buildAnalysisPrompt(makeParams({ language: null }))
            expect(result).not.toContain('주요 언어')
        })

        it('labels가 있으면 라벨을 쉼표 구분으로 포함한다', () => {
            const result = buildAnalysisPrompt(makeParams({ labels: ['bug', 'good first issue'] }))
            expect(result).toContain('라벨: bug, good first issue')
        })

        it('labels가 빈 배열이면 라벨 줄을 생략한다', () => {
            const result = buildAnalysisPrompt(makeParams({ labels: [] }))
            expect(result).not.toContain('라벨')
        })

        it('body가 있으면 이슈 내용을 포함한다', () => {
            const result = buildAnalysisPrompt(makeParams({ body: '재현 방법: ...' }))
            expect(result).toContain('이슈 내용')
            expect(result).toContain('재현 방법: ...')
        })

        it('body가 null이면 이슈 내용 섹션을 생략한다', () => {
            const result = buildAnalysisPrompt(makeParams({ body: null }))
            expect(result).not.toContain('이슈 내용')
        })
    })

    describe('README 섹션', () => {
        it('contributingGuide가 있으면 프로젝트 개요 섹션을 포함한다', () => {
            const result = buildAnalysisPrompt(makeParams({ contributingGuide: '# Setup\nnpm install' }))
            expect(result).toContain('[프로젝트 개요 (README)]')
            expect(result).toContain('npm install')
        })

        it('contributingGuide가 null이면 README 섹션을 생략한다', () => {
            const result = buildAnalysisPrompt(makeParams({ contributingGuide: null }))
            expect(result).not.toContain('[프로젝트 개요')
        })
    })

    describe('섹션 순서', () => {
        it('기여자 정보가 이슈 정보보다 앞에 온다', () => {
            const result = buildAnalysisPrompt(makeParams())
            expect(result.indexOf('[기여자 정보]')).toBeLessThan(result.indexOf('[이슈 정보]'))
        })

        it('이슈 정보가 README보다 앞에 온다', () => {
            const result = buildAnalysisPrompt(makeParams({ contributingGuide: '# Readme' }))
            expect(result.indexOf('[이슈 정보]')).toBeLessThan(result.indexOf('[프로젝트 개요'))
        })
    })
})
