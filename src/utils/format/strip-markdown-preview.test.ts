import { describe, it, expect } from 'vitest'
import { stripMarkdownPreview } from './strip-markdown-preview'

describe('stripMarkdownPreview', () => {
  it('헤딩·체크박스 템플릿을 걷어내고 본문만 남긴다', () => {
    const body = '### Describe the bug\n\n- [ ] I checked existing issues\n\n로그인 버튼이 눌러도 반응하지 않습니다.'
    expect(stripMarkdownPreview(body)).toBe('로그인 버튼이 눌러도 반응하지 않습니다.')
  })

  it('이미지와 링크를 정리한다', () => {
    const body = '![screenshot](https://example.com/a.png)\n\n재현 방법은 [여기](https://example.com)를 참고하세요.'
    expect(stripMarkdownPreview(body)).toBe('재현 방법은 여기를 참고하세요.')
  })

  it('코드 블록과 인라인 코드를 정리한다', () => {
    const body = '```ts\nconst a = 1\n```\n\n`useAuth` 훅에서 상태 동기화 타이밍 문제로 추정됩니다.'
    expect(stripMarkdownPreview(body)).toBe('useAuth 훅에서 상태 동기화 타이밍 문제로 추정됩니다.')
  })

  it('HTML 주석을 제거한다', () => {
    const body = '<!-- 아래 템플릿을 채워주세요 -->\n\n버튼 클릭 시 콘솔에 에러가 두 번 출력됩니다.'
    expect(stripMarkdownPreview(body)).toBe('버튼 클릭 시 콘솔에 에러가 두 번 출력됩니다.')
  })

  it('정리 후 남는 내용이 너무 짧으면 null을 반환한다', () => {
    const body = '![screenshot](https://example.com/a.png)\n\n<!-- 스크린샷만 있음 -->'
    expect(stripMarkdownPreview(body)).toBeNull()
  })
})
