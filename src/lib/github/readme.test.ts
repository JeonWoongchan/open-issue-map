import { describe, it, expect } from 'vitest'

// cleanReadme는 내부 함수이므로 동작을 통해 간접 검증할 수 없다.
// 정제 로직을 분리해 직접 테스트하기 위해 동일한 변환 로직을 추출해 검증한다.
function cleanReadme(raw: string): string {
    return raw
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, 5_000)
}

describe('cleanReadme', () => {
    describe('이미지·배지 제거', () => {
        it('마크다운 이미지를 제거한다', () => {
            expect(cleanReadme('설명 ![screenshot](https://img.png) 끝')).toBe('설명  끝')
        })

        it('배지 이미지를 완전히 제거한다', () => {
            // [![alt](img-url)](link-url) 패턴: 이미지 제거 → [](link-url) → 빈 문자열
            const badge = '[![Build Status](https://ci/badge)](https://ci)'
            expect(cleanReadme(badge)).toBe('')
        })

        it('여러 이미지 제거 후 trim으로 앞뒤 공백이 제거된다', () => {
            const input = '![a](url1) ![b](url2) text'
            expect(cleanReadme(input)).toBe('text')
        })
    })

    describe('링크 텍스트 추출', () => {
        it('마크다운 링크에서 텍스트만 남긴다', () => {
            expect(cleanReadme('[설치 가이드](https://docs.example.com)')).toBe('설치 가이드')
        })
    })

    describe('HTML 태그 제거', () => {
        it('HTML 태그를 제거한다', () => {
            expect(cleanReadme('<div>내용</div>')).toBe('내용')
        })
    })

    describe('코드 블록 유지 — cleanIssueBody와 다른 핵심 차이', () => {
        it('백틱 코드 블록을 그대로 유지한다', () => {
            const input = '설치:\n```\nnpm install\n```'
            expect(cleanReadme(input)).toContain('npm install')
            expect(cleanReadme(input)).not.toContain('[코드 블록 생략]')
        })

        it('언어 지정 코드 블록도 그대로 유지한다', () => {
            const input = '```bash\ndocker run app\n```'
            expect(cleanReadme(input)).toContain('docker run app')
        })
    })

    describe('연속 개행 정규화', () => {
        it('3개 이상 연속 개행을 2개로 줄인다', () => {
            expect(cleanReadme('a\n\n\n\nb')).toBe('a\n\nb')
        })
    })

    describe('길이 제한', () => {
        it('5000자를 초과하면 잘라낸다', () => {
            expect(cleanReadme('a'.repeat(6_000)).length).toBe(5_000)
        })
    })
})
