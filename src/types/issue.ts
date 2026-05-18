import type { ScoreThreshold, StarThreshold } from '@/constants/scoring-rules'
import type { ContributionType, ExperienceLevel } from './user'

// SCORING_DIMENSIONS의 key와 1:1 대응 — 차원 추가·삭제 시 여기도 함께 수정한다.
export type ScoreBreakdownKey =
  | 'language'
  | 'difficulty'
  | 'contributionType'
  | 'competitionFit'
  | 'competitionPenalty'
  | 'timeBudget'
  | 'purpose'
  | 'stars'

// 각 채점 차원의 기여 점수 — 음수 가능(경쟁도 패널티 등)
export type ScoreBreakdown = Record<ScoreBreakdownKey, number>

export type CompetitionLevel = 'OPEN' | 'ACTIVE' | 'HAS_PR'
export type DifficultyLevel = ExperienceLevel
export type RepoActivityLevel = 'active' | 'moderate' | 'quiet'

export type IssueFilters = {
  language: string | null
  difficultyLevel: DifficultyLevel | null
  contributionTypes: ContributionType[]
  competitionLevels: CompetitionLevel[]
  minScore: ScoreThreshold | null
  minStars: StarThreshold | null
}

export const EMPTY_ISSUE_FILTERS: IssueFilters = {
  language: null,
  difficultyLevel: null,
  contributionTypes: [],
  competitionLevels: [],
  minScore: null,
  minStars: null,
}

export interface RawIssue {
  number: number
  title: string
  url: string
  body: string | null
  createdAt: string
  updatedAt: string
  comments: { totalCount: number }
  reactions: { totalCount: number }
  labels: { nodes: { name: string }[] }
  repository: {
    nameWithOwner: string
    url: string
    primaryLanguage: { name: string } | null
    stargazerCount: number
    pushedAt: string
  }
  // GraphQL로 연결된 PR 존재 여부
  timelineItems: {
    nodes: { __typename: string }[]
  }
}

export interface ScoredIssue {
  // 원본 데이터
  number: number
  title: string
  url: string
  repoFullName: string
  repoUrl: string
  language: string | null
  stargazerCount: number
  labels: string[]
  commentCount: number
  createdAt: string
  updatedAt: string

  // AI 분석용 본문 (500자 제한, 선택적)
  body?: string | null

  // 스코어링 결과
  score: number
  difficultyLevel: DifficultyLevel | null
  contributionType: ContributionType | null
  competitionLevel: CompetitionLevel
  hasPR: boolean
  repoActivityLevel: RepoActivityLevel
  scoreBreakdown?: ScoreBreakdown
  isBookmarked?: boolean
}

export interface IssueCardItem {
  number: number
  title: string
  url: string
  repoFullName: string
  repoUrl: string
  language: string | null
  stargazerCount: number
  labels: string[]
  commentCount: number
  createdAt: string
  updatedAt: string
  body?: string | null
  score: number | null
  difficultyLevel: DifficultyLevel | null
  contributionType: ContributionType | null
  competitionLevel: CompetitionLevel | null
  hasPR: boolean
  repoActivityLevel: RepoActivityLevel | null
  scoreBreakdown?: ScoreBreakdown
  isBookmarked?: boolean
}
