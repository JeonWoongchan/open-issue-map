import sql from '@/lib/db'
import { createAiProvider } from '@/lib/ai'
import type { OnboardingInsightParams } from '@/lib/ai'
import type { OnboardingInsight } from '@/types/onboarding-insight'

type SaveOnboardingInsightInput =
  | { status: 'success'; adviceItems: string[] }
  | { status: 'failed' }

export async function saveOnboardingInsight(
  githubUserId: string,
  input: SaveOnboardingInsightInput
): Promise<void> {
  const adviceItems = input.status === 'success' ? JSON.stringify(input.adviceItems) : null

  await sql`
    INSERT INTO onboarding_insights (user_id, status, advice_items, updated_at)
    VALUES (
      (SELECT id FROM users WHERE github_id = ${githubUserId}),
      ${input.status},
      ${adviceItems},
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      advice_items = EXCLUDED.advice_items,
      updated_at = NOW()
  `
}

export async function loadOnboardingInsight(githubUserId: string): Promise<OnboardingInsight | null> {
  const rows = await sql`
    SELECT oi.status, oi.advice_items
    FROM onboarding_insights oi
    JOIN users u ON u.id = oi.user_id
    WHERE u.github_id = ${githubUserId}
  `

  if (rows.length === 0) {
    return null
  }

  const row = rows[0]

  return {
    status: row.status,
    adviceItems: row.advice_items ?? null,
  }
}

// AI 호출 실패든 그 이후 실패 상태 기록이든, 이 함수 자체는 절대 throw하지 않는다 —
// 호출부(온보딩 제출, 대시보드 재시도)의 주 흐름을 AI 결과와 무관하게 항상 성공시키기 위함.
export async function generateAndCacheOnboardingInsight(
  githubUserId: string,
  params: OnboardingInsightParams
): Promise<void> {
  try {
    const result = await createAiProvider().generateOnboardingInsight(params)
    await saveOnboardingInsight(githubUserId, { status: 'success', adviceItems: result.adviceItems })
  } catch (error) {
    console.error('Onboarding insight generation error:', error)
    await saveOnboardingInsight(githubUserId, { status: 'failed' }).catch(() => {})
  }
}
