// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AiGuidePanel } from './AiGuidePanel'
import type { IssueAnalysis } from '@/lib/ai'

const LONG_CONCEPT = 'ExtremelyLongConceptNameWithoutAnyNaturalBreakPoint'

const ANALYSIS: IssueAnalysis = {
  concepts: [LONG_CONCEPT],
  scope: '작업 범위',
  startingPoints: ['src/very/long/path/without/a/natural/breakpoint.ts'],
  cautions: ['주의할 점'],
  expectedBenefit: '기대 효과',
  issueOverview: {
    summary: '요약',
    analysis: '분석',
    summarySections: [{ heading: null, items: ['본문 요약'] }],
  },
  contributionGuideInsight: {
    commitConventionNote: '커밋 규칙',
    claNote: 'CLA 규칙',
  },
  contributionRules: {
    contributingGuidePath: null,
    pullRequestTemplatePath: null,
  },
}

describe('AiGuidePanel', () => {
  it('긴 개념 배지가 모바일 카드 폭 안에서 줄바꿈될 수 있다', () => {
    render(<AiGuidePanel analysis={ANALYSIS} />)

    expect(screen.getByText(LONG_CONCEPT)).toHaveClass(
      'max-w-full',
      'whitespace-normal',
      '[overflow-wrap:anywhere]',
      'break-keep',
    )
  })
})
