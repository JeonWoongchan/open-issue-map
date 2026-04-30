import { CONTRIBUTION_TYPES, EXPERIENCE_LEVELS, PURPOSES, WEEKLY_HOURS } from '@/constants/contribution-levels'
import type { ContributionType, ExperienceLevel, Purpose, WeeklyHours } from '@/types/user'

// contribution-levels.ts를 단일 출처로 삼아 레이블 맵을 파생한다.
// 새 값이 상수 파일에 추가되면 자동으로 반영된다.
const EXPERIENCE_LEVEL_LABELS = Object.fromEntries(
  EXPERIENCE_LEVELS.map(({ value, label }) => [value, label])
) as Record<ExperienceLevel, string>

const CONTRIBUTION_TYPE_LABELS = Object.fromEntries(
  CONTRIBUTION_TYPES.map(({ value, label }) => [value, label])
) as Record<ContributionType, string>

const WEEKLY_HOURS_LABELS = Object.fromEntries(
  WEEKLY_HOURS.map(({ value, label }) => [value, label])
) as Record<WeeklyHours, string>

const PURPOSE_LABELS = Object.fromEntries(
  PURPOSES.map(({ value, label }) => [value, label])
) as Record<Purpose, string>

export function renderMyPageValue(value: string | null): string {
  return value ?? '아직 설정되지 않았습니다.'
}

export function getExperienceLevelLabel(value: ExperienceLevel | null): string | null {
  return value ? EXPERIENCE_LEVEL_LABELS[value] : null
}

export function getContributionTypeLabel(value: ContributionType): string {
  return CONTRIBUTION_TYPE_LABELS[value]
}

export function getWeeklyHoursLabel(value: WeeklyHours | null): string | null {
  return value ? WEEKLY_HOURS_LABELS[value] : null
}

export function getPurposeLabel(value: Purpose | null): string | null {
  return value ? PURPOSE_LABELS[value] : null
}
