import { describe, it, expect } from 'vitest'
import { getLanguageColor } from './language-colors'

describe('getLanguageColor', () => {
  it('매핑된 언어는 관례 색을 반환한다', () => {
    expect(getLanguageColor('TypeScript')).toBe('#3178c6')
  })

  it('매핑에 없는 언어는 폴백 회색을 반환한다', () => {
    expect(getLanguageColor('Brainfuck')).toBe('#8b949e')
  })

  it('null이면 폴백 회색을 반환한다', () => {
    expect(getLanguageColor(null)).toBe('#8b949e')
  })
})
