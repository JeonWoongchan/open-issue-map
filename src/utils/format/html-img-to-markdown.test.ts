import { describe, it, expect } from 'vitest'
import { convertHtmlImgToMarkdown } from './html-img-to-markdown'

describe('convertHtmlImgToMarkdown', () => {
    it('width/height/alt/src가 있는 img 태그를 마크다운 이미지로 변환한다', () => {
        const input = '<img width="1919" height="965" alt="Image" src="https://example.com/a.png" />'
        expect(convertHtmlImgToMarkdown(input)).toBe('![Image](https://example.com/a.png)')
    })

    it('속성 순서가 달라도 src와 alt를 올바르게 추출한다', () => {
        const input = '<img src="https://example.com/b.png" alt="스크린샷">'
        expect(convertHtmlImgToMarkdown(input)).toBe('![스크린샷](https://example.com/b.png)')
    })

    it('alt 속성이 없으면 빈 alt로 변환한다', () => {
        const input = '<img src="https://example.com/c.png">'
        expect(convertHtmlImgToMarkdown(input)).toBe('![](https://example.com/c.png)')
    })

    it('여러 개의 img 태그를 각각 변환한다', () => {
        const input = '<img src="url1" alt="a"><img src="url2" alt="b">'
        expect(convertHtmlImgToMarkdown(input)).toBe('![a](url1)![b](url2)')
    })

    it('src가 없는 img 태그는 원문 그대로 둔다', () => {
        const input = '<img alt="깨진 이미지">'
        expect(convertHtmlImgToMarkdown(input)).toBe('<img alt="깨진 이미지">')
    })

    it('앞뒤 텍스트와 이미지 태그가 섞여 있어도 이미지만 변환한다', () => {
        const input = '설명 텍스트\n<img src="https://example.com/d.png" alt="d">\n뒤 텍스트'
        expect(convertHtmlImgToMarkdown(input)).toBe('설명 텍스트\n![d](https://example.com/d.png)\n뒤 텍스트')
    })

    it('img 태그가 없으면 원문을 그대로 반환한다', () => {
        expect(convertHtmlImgToMarkdown('그냥 텍스트입니다.')).toBe('그냥 텍스트입니다.')
    })
})
