import sql from '@/lib/db'
import type { IssueAnalysis } from './types'
import { issueAnalysisSchema } from './schema'
import { ANALYSIS_PROMPT_VERSION } from './prompt'

export type IssueGuideCacheKey = {
  cacheUserId: string
  repoFullName: string
  issueNumber: number
}

// updatedAt 비교가 주 무효화 기준이고, 이건 그 위에 얹는 보조 상한(무기한 방치된 캐시 정리용)이다.
const CACHE_MAX_AGE_DAYS = 60

// 캐시 생성 시점 이슈의 GitHub updatedAt과 지금 막 새로 가져온 값이 같을 때만 히트로 본다 —
// 제목/본문/라벨 수정, 새 댓글 등으로 이슈가 조금이라도 바뀌면 값이 달라지므로 이 비교만으로
// 충분한 신선도 판별이 된다(추가 API 호출 없이, 어차피 상세 페이지가 매번 새로 가져오는 값이라).
export async function getCachedIssueGuide(
  key: IssueGuideCacheKey,
  issueUpdatedAt: string,
): Promise<IssueAnalysis | null> {
  const rows = await sql`
    SELECT analysis
    FROM issue_ai_guides
    WHERE cache_user_id = ${key.cacheUserId}
      AND repo_full_name = ${key.repoFullName}
      AND issue_number = ${key.issueNumber}
      AND issue_updated_at = ${issueUpdatedAt}
      AND prompt_version = ${ANALYSIS_PROMPT_VERSION}
      AND created_at > NOW() - ${CACHE_MAX_AGE_DAYS} * INTERVAL '1 day'
  `

  if (rows.length === 0) return null

  // 응답 스키마가 바뀐 뒤에도 이전 스키마로 저장된 행이 남아있을 수 있다 — 검증 없이 그대로
  // 반환하면 클라이언트가 새로 추가된 필드를 undefined로 렌더링하다 크래시한다. 검증에 실패하면
  // 캐시 미스로 취급해 새로 생성하게 한다(별도 무효화 마이그레이션 없이 자연스럽게 갱신됨).
  const parsed = issueAnalysisSchema.safeParse(rows[0].analysis)
  return parsed.success ? (parsed.data as IssueAnalysis) : null
}

export async function saveIssueGuideCache(
  key: IssueGuideCacheKey,
  issueUpdatedAt: string,
  analysis: IssueAnalysis,
): Promise<void> {
  // Postgres jsonb는 null 문자를 표현하지 못해 그대로 넣으면 INSERT가 거부된다 — AI 응답이
  // 이슈 본문을 그대로 인용하는 경우 간혹 섞여 들어올 수 있어 candidate-pool-store.ts와
  // 동일하게 저장 전 제거한다.
  const payload = JSON.stringify(analysis).replace(/\\u0000/g, '')

  await sql`
    INSERT INTO issue_ai_guides (
      cache_user_id,
      repo_full_name,
      issue_number,
      issue_updated_at,
      prompt_version,
      analysis,
      created_at
    )
    VALUES (
      ${key.cacheUserId},
      ${key.repoFullName},
      ${key.issueNumber},
      ${issueUpdatedAt},
      ${ANALYSIS_PROMPT_VERSION},
      ${payload},
      NOW()
    )
    ON CONFLICT (cache_user_id, repo_full_name, issue_number)
    DO UPDATE SET
      issue_updated_at = EXCLUDED.issue_updated_at,
      prompt_version = EXCLUDED.prompt_version,
      analysis = EXCLUDED.analysis,
      created_at = NOW()
  `
}
