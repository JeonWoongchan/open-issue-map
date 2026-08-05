// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IssueSearchForm } from './IssueSearchForm'

describe('IssueSearchForm', () => {
  it('모바일에서 입력 영역이 줄어들 수 있고 검색창에 접근 가능한 이름이 있다', () => {
    render(<IssueSearchForm value="" onSubmitAction={vi.fn()} />)

    const input = screen.getByRole('textbox', { name: 'GitHub 전체 이슈 검색' })

    expect(input.parentElement).toHaveClass('min-w-0')
  })
})
