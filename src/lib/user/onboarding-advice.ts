import sql from '@/lib/db'
import type { ContributionType, Purpose } from '@/types/user'

// 온보딩 조합(기여방식 × 목적)마다 정적으로 미리 써둔 문장 5개 세트를 그대로 조회한다.
// contributionTypes는 다중 선택이라 그중 어떤 값을 쓸지는 호출부가 결정한다(무작위 선택은 여기서 하지 않는다).
export async function getOnboardingAdvice(
  contributionType: ContributionType,
  purpose: Purpose,
): Promise<string[] | null> {
  const rows = await sql`
    SELECT sentences
    FROM onboarding_advice
    WHERE contribution_type = ${contributionType} AND purpose = ${purpose}
  `

  if (rows.length === 0) {
    return null
  }

  return rows[0].sentences as string[]
}
