import { DIMENSION_LABELS, DIMENSION_ORDER } from '@/lib/github/issues/score-breakdown-meta'
import type { ScoreBreakdown } from '@/types/issue'

type WhyItFitsCalloutProps = {
  scoreBreakdown: ScoreBreakdown
}

// 채점 차원 중 실제로 가산이 있었던(양수) 것만, 기여도가 큰 순으로 최대 2개를 골라 이유로 보여준다 —
// 지어낸 문구가 아니라 scoreBreakdown 값에서 그대로 파생된 설명이다.
export function WhyItFitsCallout({ scoreBreakdown }: WhyItFitsCalloutProps) {
  const topReasons = DIMENSION_ORDER
    .map((key) => ({ key, value: scoreBreakdown[key] }))
    .filter((dimension) => dimension.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((dimension) => DIMENSION_LABELS[dimension.key])

  if (topReasons.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border-l-4 border-interactive-action bg-gradient-to-r from-brand-subtle to-transparent px-4 py-3 text-sm text-foreground">
      <span className="font-semibold">{topReasons.join(', ')}</span> 조건이 회원님의 프로필과 잘 맞아요.
    </div>
  )
}
