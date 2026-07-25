import type { CompetitionLevel, DifficultyLevel, RepoActivityLevel } from '@/types/issue'
import type { PullRequestState } from '@/types/pull-request'

export type BadgeMeta = {
  label: string
  className: string
}

export type CompetitionMeta = BadgeMeta & {
  // 이슈 카드처럼 태그가 많이 몰리는 곳에서 이 경쟁도까지 배지로 강조할지 — 지금은 PR이 이미
  // 있는 경우만 "예외 신호"로 취급하고 나머지(OPEN/ACTIVE)는 조용히 둔다는 결정을 데이터로 표현한다.
  highlightOnCard: boolean
}
export type RepoActivityMeta = BadgeMeta

const COMPETITION_META: Record<CompetitionLevel, CompetitionMeta> = {
  OPEN: {
    label: '오픈',
    className: 'border-status-success-border bg-status-success text-status-success-foreground',
    highlightOnCard: false,
  },
  ACTIVE: {
    label: '진행중',
    className: 'border-status-warning-border bg-status-warning text-status-warning-foreground',
    highlightOnCard: false,
  },
  HAS_PR: {
    label: 'PR 있음',
    className: 'border-status-danger-border bg-status-danger text-status-danger-foreground',
    highlightOnCard: true,
  },
}

export const DIFFICULTY_LABELS_KO: Record<DifficultyLevel, string> = {
  beginner: '입문',
  junior: '주니어',
  mid: '미들',
  senior: '시니어',
}

export function getCompetitionMeta(level: CompetitionLevel): CompetitionMeta {
  return COMPETITION_META[level]
}

const REPO_ACTIVITY_META: Record<RepoActivityLevel, RepoActivityMeta> = {
  active: {
    label: '활성도 활발',
    className: 'border-status-success-border bg-status-success text-status-success-foreground',
  },
  moderate: {
    label: '활성도 보통',
    className: 'border-status-warning-border bg-status-warning text-status-warning-foreground',
  },
  quiet: {
    label: '활성도 낮음',
    className: 'border-muted bg-muted text-muted-foreground',
  },
}

export function getRepoActivityMeta(level: RepoActivityLevel): RepoActivityMeta {
  return REPO_ACTIVITY_META[level]
}

export type PRStateMeta = BadgeMeta

export const PR_STATE_META: Record<PullRequestState, PRStateMeta> = {
  OPEN: { label: '진행중', className: 'border-brand-subtle-border bg-interactive-action text-interactive-action-foreground' },
  MERGED: { label: '병합됨', className: 'border-status-success-border bg-status-success text-status-success-foreground' },
  CLOSED: { label: '닫힘', className: 'border-status-danger-border bg-status-danger text-status-danger-foreground' },
}
