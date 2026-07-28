import sql from '@/lib/db'
import type { RecommendationCondition } from '@/constants/recommendation'
import type { RawIssue } from '@/types/issue'

// 여러 언어 + 조건 하나에 대해 스케줄러가 미리 적재해둔 후보 풀을 한 번의 쿼리로 읽는다 —
// 요청 경로(fetchRecommendedIssues)가 프로필의 언어 수만큼 왕복(round trip)하지 않도록 배치로 조회한다.
export async function getCandidatePools(
  languages: string[],
  condition: RecommendationCondition,
): Promise<RawIssue[][]> {
  if (languages.length === 0) {
    return []
  }

  const rows = await sql`
    SELECT payload
    FROM recommendation_candidate_pools
    WHERE language = ANY(${languages}) AND condition = ${condition}
  `

  return rows.map((row) => row.payload as RawIssue[])
}

// 스케줄러(크론)만 호출한다 — 언어 하나 + 조건 하나의 후보 풀을 통째로 교체(upsert)한다.
// 요청 경로는 이 함수를 절대 호출하지 않는다(항상 읽기 전용).
export async function upsertCandidatePool(
  language: string,
  condition: RecommendationCondition,
  issues: RawIssue[],
): Promise<void> {
  // Postgres jsonb는 null 문자를 표현하지 못해 그대로 넣으면 INSERT가 거부된다
  // ("unsupported Unicode escape sequence") — 이슈 본문에 간혹 섞여 들어오는 걸 실측으로 확인해서 제거한다.
  const payload = JSON.stringify(issues).replace(/\\u0000/g, '')

  await sql`
    INSERT INTO recommendation_candidate_pools (language, condition, payload, updated_at)
    VALUES (${language}, ${condition}, ${payload}, NOW())
    ON CONFLICT (language, condition)
    DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = NOW()
  `
}
