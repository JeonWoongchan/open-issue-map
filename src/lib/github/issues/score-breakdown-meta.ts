import type { ScoreBreakdownKey } from '@/types/issue'

// 점수 표시 순서 — scorer.ts의 SCORING_DIMENSIONS key 순서와 동일하게 유지
export const DIMENSION_ORDER: ScoreBreakdownKey[] = [
  'language',
  'difficulty',
  'contributionType',
  'competition',
  'timeBudget',
  'purpose',
  'stars',
]

export const DIMENSION_LABELS: Record<ScoreBreakdownKey, string> = {
  language: '언어 일치',
  difficulty: '난이도 적합도',
  contributionType: '기여 유형',
  competition: '경쟁도',
  timeBudget: '시간 예산',
  purpose: '목적 적합도',
  stars: '저장소 인지도',
}

// 미니 바 차트 정규화용 — scoring-rules.ts에 흩어진 각 차원의 이론상 최대 절댓값(대략치).
// 정확한 상한이 아니라 "이 차원이 상대적으로 얼마나 크게 기여했는지"를 보여주기 위한 시각적 스케일이다.
export const DIMENSION_MAX_MAGNITUDE: Record<ScoreBreakdownKey, number> = {
  language: 28,
  difficulty: 23,
  contributionType: 16,
  competition: 18,
  timeBudget: 8,
  purpose: 14,
  stars: 4,
}

export function formatScore(score: number): string {
  return score > 0 ? `+${score}` : String(score)
}
