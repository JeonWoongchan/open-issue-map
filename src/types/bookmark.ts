import type { CompetitionLevel, DifficultyLevel, RepoActivityLevel } from './issue'
import type { ContributionType } from './user'

// 북마크 저장 시점의 이슈 카드 스냅샷 — 이후 갱신되지 않는다(북마크 시점 값으로 고정).
export interface Bookmark {
  id: string
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
  // 북마크 행 자체의 생성·수정 시각(이슈 자체의 시각과는 다름)
  createdAt: string
  updatedAt: string
}
