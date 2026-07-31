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

// JS 문자열 리터럴/정규식에 널 문자를 직접 박아넣으면 소스 파일에 실제 제어 문자가 섞여
// 편집 도구·에디터마다 다르게 다뤄질 위험이 있어, 코드 포인트로 만들어 쓴다.
const NULL_CHAR = String.fromCharCode(0)

// 스케줄러(크론)만 호출한다 — 언어 하나 + 조건 하나의 후보 풀을 통째로 교체(upsert)한다.
// 요청 경로는 이 함수를 절대 호출하지 않는다(항상 읽기 전용).
export async function upsertCandidatePool(
  language: string,
  condition: RecommendationCondition,
  issues: RawIssue[],
): Promise<void> {
  // Postgres jsonb는 널 문자를 표현하지 못해 그대로 넣으면 INSERT가 거부된다 — 이슈 본문에
  // 간혹 섞여 들어오는 걸 실측으로 확인해서 제거한다.
  // 반드시 원본 문자열 값 단계에서 제거해야 한다 — 예전엔 JSON.stringify가 끝난 "이스케이프된
  // 텍스트"를 정규식으로 사후 치환했는데, 널 문자가 백슬래시 많은 마크다운(예: `"\"` 같은 코드
  // 스팬) 근처에 있으면 인접한 이스케이프 시퀀스의 백슬래시까지 같이 지워져 JSON 구조가 깨지는
  // 게 실측으로 확인됐다(Postgres가 "invalid input syntax for type json"으로 INSERT 거부,
  // Java+latest 조합에서 재현). replacer로 원본 문자열 단계에서 지우면 JSON.stringify가 그 다음
  // 정상적으로 이스케이프하므로 이 문제가 없다.
  const payload = JSON.stringify(issues, (_key, value) =>
    typeof value === 'string' ? value.split(NULL_CHAR).join('') : value
  )

  await sql`
    INSERT INTO recommendation_candidate_pools (language, condition, payload, updated_at)
    VALUES (${language}, ${condition}, ${payload}, NOW())
    ON CONFLICT (language, condition)
    DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = NOW()
  `
}
