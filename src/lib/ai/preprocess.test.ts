import { describe, it, expect } from 'vitest'
import { cleanIssueBody } from '@/lib/ai/preprocess'

describe('cleanIssueBody', () => {
    describe('null / 빈 입력', () => {
        it('null 입력 시 빈 문자열을 반환한다', () => {
            expect(cleanIssueBody(null)).toBe('')
        })

        it('빈 문자열 입력 시 빈 문자열을 반환한다', () => {
            expect(cleanIssueBody('')).toBe('')
        })
    })

    describe('코드 블록 제거', () => {
        it('코드 블록을 [코드 블록 생략]으로 대체한다', () => {
            const input = 'before\n```\nconsole.log("hello")\n```\nafter'
            expect(cleanIssueBody(input)).toBe('before\n[코드 블록 생략]\nafter')
        })

        it('언어 지정 코드 블록도 대체한다', () => {
            const input = '```typescript\nconst x = 1\n```'
            expect(cleanIssueBody(input)).toBe('[코드 블록 생략]')
        })

        it('여러 코드 블록을 각각 대체한다', () => {
            const input = '```\nfirst\n```\nmiddle\n```\nsecond\n```'
            expect(cleanIssueBody(input)).toBe('[코드 블록 생략]\nmiddle\n[코드 블록 생략]')
        })
    })

    describe('HTML 태그 제거', () => {
        it('단일 HTML 태그를 제거한다', () => {
            expect(cleanIssueBody('<p>Hello</p>')).toBe('Hello')
        })

        it('여러 HTML 태그를 모두 제거한다', () => {
            expect(cleanIssueBody('<b>bold</b> and <i>italic</i>')).toBe('bold and italic')
        })
    })

    describe('마크다운 이미지 제거', () => {
        it('마크다운 이미지 구문을 제거한다', () => {
            // trim()이 적용되어 후행 공백이 제거됨
            const input = '이미지: ![스크린샷](https://example.com/img.png)'
            expect(cleanIssueBody(input)).toBe('이미지:')
        })
    })

    describe('마크다운 링크 텍스트 추출', () => {
        it('마크다운 링크에서 텍스트만 남긴다', () => {
            const input = '[GitHub Issues](https://github.com/issues) 참고'
            expect(cleanIssueBody(input)).toBe('GitHub Issues 참고')
        })
    })

    describe('연속 개행 정규화', () => {
        it('3개 이상 연속 개행을 2개로 줄인다', () => {
            expect(cleanIssueBody('first\n\n\n\nfourth')).toBe('first\n\nfourth')
        })

        it('2개 이하 개행은 그대로 유지한다', () => {
            expect(cleanIssueBody('first\nsecond\n\nthird')).toBe('first\nsecond\n\nthird')
        })
    })

    describe('길이 제한', () => {
        it('2000자 초과 입력을 2000자로 자른다', () => {
            const longText = 'a'.repeat(3000)
            expect(cleanIssueBody(longText).length).toBe(2000)
        })

        it('2000자 이하 입력은 자르지 않는다', () => {
            const shortText = 'a'.repeat(500)
            expect(cleanIssueBody(shortText).length).toBe(500)
        })
    })

    describe('앞뒤 공백 제거', () => {
        it('앞뒤 공백과 개행을 제거한다', () => {
            expect(cleanIssueBody('  hello  ')).toBe('hello')
        })
    })

    describe('복합 변환', () => {
        it('코드 블록·이미지·링크를 순서대로 처리한다', () => {
            const input = [
                '이슈 설명: [관련 링크](https://example.com)',
                '```\ncode here\n```',
                '![스크린샷](https://example.com/img.png)',
            ].join('\n')

            const result = cleanIssueBody(input)

            expect(result).toContain('관련 링크')
            expect(result).toContain('[코드 블록 생략]')
            expect(result).not.toContain('code here')
            expect(result).not.toContain('https://example.com/img.png')
        })
    })
})
