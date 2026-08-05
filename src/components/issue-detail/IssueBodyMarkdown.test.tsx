// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IssueBodyMarkdown } from './IssueBodyMarkdown'

describe('IssueBodyMarkdown', () => {
  it('표 의미를 유지하면서 좁은 화면에서는 가로 스크롤할 수 있다', () => {
    render(<IssueBodyMarkdown body={'| 항목 | 내용 |\n| --- | --- |\n| 테스트 | 설명 |'} />)

    const table = screen.getByRole('table')

    expect(table.parentElement).toHaveClass('max-w-full', 'overflow-x-auto')
  })
})
