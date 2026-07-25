import sql from '@/lib/db'
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
