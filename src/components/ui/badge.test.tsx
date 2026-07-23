// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
    it('기본 variant로 렌더링된다', () => {
        render(<Badge>New</Badge>)

        const badge = screen.getByText('New')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveAttribute('data-variant', 'default')
    })

    it('variant prop이 data-variant에 반영된다', () => {
        render(<Badge variant="destructive">Error</Badge>)

        expect(screen.getByText('Error')).toHaveAttribute('data-variant', 'destructive')
    })
})
