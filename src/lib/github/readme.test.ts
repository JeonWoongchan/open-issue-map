import { describe, it, expect } from 'vitest'
import { cleanMarkdownForAi } from './readme'

describe('cleanMarkdownForAi', () => {
    describe('이미지·배지 제거', () => {
        it('마크다운 이미지를 제거한다', () => {
            expect(cleanMarkdownForAi('설명 ![screenshot](https://img.png) 끝')).toBe('설명  끝')
        })

        it('배지 이미지를 완전히 제거한다', () => {
            // [![alt](img-url)](link-url) 패턴: 이미지 제거 → [](link-url) → 빈 문자열
            const badge = '[![Build Status](https://ci/badge)](https://ci)'
            expect(cleanMarkdownForAi(badge)).toBe('')
        })

        it('여러 이미지 제거 후 trim으로 앞뒤 공백이 제거된다', () => {
            const input = '![a](url1) ![b](url2) text'
            expect(cleanMarkdownForAi(input)).toBe('text')
        })
    })

    describe('링크 텍스트 추출', () => {
        it('마크다운 링크에서 텍스트만 남긴다', () => {
            expect(cleanMarkdownForAi('[설치 가이드](https://docs.example.com)')).toBe('설치 가이드')
        })
    })

    describe('HTML 태그 제거', () => {
        it('HTML 태그를 제거한다', () => {
            expect(cleanMarkdownForAi('<div>내용</div>')).toBe('내용')
        })
    })

    describe('코드 블록 유지 — cleanIssueBody와 다른 핵심 차이', () => {
        it('백틱 코드 블록을 그대로 유지한다', () => {
            const input = '설치:\n```\nnpm install\n```'
            expect(cleanMarkdownForAi(input)).toContain('npm install')
            expect(cleanMarkdownForAi(input)).not.toContain('[코드 블록 생략]')
        })

        it('언어 지정 코드 블록도 그대로 유지한다', () => {
            const input = '```bash\ndocker run app\n```'
            expect(cleanMarkdownForAi(input)).toContain('docker run app')
        })
    })

    describe('연속 개행 정규화', () => {
        it('3개 이상 연속 개행을 2개로 줄인다', () => {
            expect(cleanMarkdownForAi('a\n\n\n\nb')).toBe('a\n\nb')
        })
    })

    describe('길이 제한', () => {
        it('5000자를 초과하면 잘라낸다', () => {
            expect(cleanMarkdownForAi('a'.repeat(6_000)).length).toBe(5_000)
        })
    })
})
