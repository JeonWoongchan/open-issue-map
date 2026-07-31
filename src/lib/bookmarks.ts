import sql from '@/lib/db'
import type { Bookmark } from '@/types/bookmark'
import type { CompetitionLevel, DifficultyLevel, RepoActivityLevel } from '@/types/issue'
import type { ContributionType } from '@/types/user'

type CreateBookmarkInput = {
  issueNumber: number
  repoFullName: string
  issueTitle: string
  issueUrl: string
  repoUrl: string
  language: string | null
  stargazerCount: number
  labels: string[]
  commentCount: number
  issueBody: string | null
  issueCreatedAt: string
  issueUpdatedAt: string
  score: number | null
  difficultyLevel: DifficultyLevel | null
  contributionType: ContributionType | null
  competitionLevel: CompetitionLevel | null
  hasPR: boolean
  repoActivityLevel: RepoActivityLevel | null
}

type ListUserBookmarksOptions = {
  limit?: number
  offset?: number
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

// 사용자 북마크 키 목록 조회 함수
export async function listUserBookmarkKeys(githubUserId: string): Promise<string[]> {
  const rows = await sql`
    SELECT b.repo_full_name, b.issue_number
    FROM bookmarks b
    JOIN users u ON u.id = b.user_id
    WHERE u.github_id = ${githubUserId}
  `

  return rows.map((row) => `${row.repo_full_name}#${row.issue_number}`)
}

// 사용자 북마크 목록 조회 함수 — 저장 시점 스냅샷을 그대로 반환한다(GitHub 재조회 없음)
export async function listUserBookmarks(
  githubUserId: string,
  options?: ListUserBookmarksOptions
): Promise<Bookmark[]> {
  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  const rows = await sql`
    SELECT
      b.id,
      b.issue_number,
      b.repo_full_name,
      b.issue_title,
      b.issue_url,
      b.repo_url,
      b.language,
      b.stargazer_count,
      b.labels,
      b.comment_count,
      b.issue_body,
      b.issue_created_at,
      b.issue_updated_at,
      b.score,
      b.difficulty_level,
      b.contribution_type,
      b.competition_level,
      b.has_pr,
      b.repo_activity_level,
      b.created_at,
      b.updated_at
    FROM bookmarks b
    JOIN users u ON u.id = b.user_id
    WHERE u.github_id = ${githubUserId}
    ORDER BY b.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `

  return rows.map((row) => ({
    id: row.id,
    issueNumber: row.issue_number,
    repoFullName: row.repo_full_name,
    issueTitle: row.issue_title,
    issueUrl: row.issue_url,
    repoUrl: row.repo_url ?? `https://github.com/${row.repo_full_name}`,
    language: row.language,
    stargazerCount: row.stargazer_count ?? 0,
    labels: row.labels ?? [],
    commentCount: row.comment_count ?? 0,
    issueBody: row.issue_body,
    issueCreatedAt: toIsoString(row.issue_created_at ?? row.created_at),
    issueUpdatedAt: toIsoString(row.issue_updated_at ?? row.updated_at),
    score: row.score,
    difficultyLevel: row.difficulty_level,
    contributionType: row.contribution_type,
    competitionLevel: row.competition_level,
    hasPR: row.has_pr ?? false,
    repoActivityLevel: row.repo_activity_level,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }))
}

// 사용자 북마크 개수 조회 함수
export async function countUserBookmarks(githubUserId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM bookmarks b
    JOIN users u ON u.id = b.user_id
    WHERE u.github_id = ${githubUserId}
  `

  return rows[0]?.count ?? 0
}

// 북마크 저장 함수 — 저장 시점 이슈 카드 데이터 전체를 스냅샷으로 함께 저장한다
export async function createBookmark(githubUserId: string, input: CreateBookmarkInput): Promise<void> {
  await sql`
    INSERT INTO bookmarks (
      user_id,
      issue_number,
      repo_full_name,
      issue_title,
      issue_url,
      repo_url,
      language,
      stargazer_count,
      labels,
      comment_count,
      issue_body,
      issue_created_at,
      issue_updated_at,
      score,
      difficulty_level,
      contribution_type,
      competition_level,
      has_pr,
      repo_activity_level,
      updated_at
    )
    VALUES (
      (SELECT id FROM users WHERE github_id = ${githubUserId}),
      ${input.issueNumber},
      ${input.repoFullName},
      ${input.issueTitle},
      ${input.issueUrl},
      ${input.repoUrl},
      ${input.language},
      ${input.stargazerCount},
      ${input.labels},
      ${input.commentCount},
      ${input.issueBody},
      ${input.issueCreatedAt},
      ${input.issueUpdatedAt},
      ${input.score},
      ${input.difficultyLevel},
      ${input.contributionType},
      ${input.competitionLevel},
      ${input.hasPR},
      ${input.repoActivityLevel},
      NOW()
    )
    ON CONFLICT (user_id, repo_full_name, issue_number)
    DO UPDATE SET
      issue_title = EXCLUDED.issue_title,
      issue_url = EXCLUDED.issue_url,
      repo_url = EXCLUDED.repo_url,
      language = EXCLUDED.language,
      stargazer_count = EXCLUDED.stargazer_count,
      labels = EXCLUDED.labels,
      comment_count = EXCLUDED.comment_count,
      issue_body = EXCLUDED.issue_body,
      issue_created_at = EXCLUDED.issue_created_at,
      issue_updated_at = EXCLUDED.issue_updated_at,
      score = EXCLUDED.score,
      difficulty_level = EXCLUDED.difficulty_level,
      contribution_type = EXCLUDED.contribution_type,
      competition_level = EXCLUDED.competition_level,
      has_pr = EXCLUDED.has_pr,
      repo_activity_level = EXCLUDED.repo_activity_level,
      updated_at = NOW()
  `
}

// 북마크 삭제 함수
export async function deleteBookmark(
  githubUserId: string,
  repoFullName: string,
  issueNumber: number
): Promise<void> {
  await sql`
    DELETE FROM bookmarks b
    USING users u
    WHERE b.user_id = u.id
      AND u.github_id = ${githubUserId}
      AND b.repo_full_name = ${repoFullName}
      AND b.issue_number = ${issueNumber}
  `
}
