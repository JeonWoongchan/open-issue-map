import { LANGUAGE_GROUPS } from './scoring-rules'
import type { StarThreshold } from './scoring-rules'
import type { ContributionType, ExperienceLevel } from '@/types/user'

// 이슈 탐색 페이지 검색창 위에 노출하는 아이콘 프리셋 — 아이콘 키는 public/icons/filters/의
// SVG 파일명과 1:1 대응하며, IssueSearchPresets.tsx가 그 경로를 그대로 <img>로 참조한다.
export type ExplorePresetIcon = 'sprout' | 'doc' | 'bug' | 'feat' | 'star'

// 프리셋은 항상 "검색 필터" 팝오버(IssueSearchFilter)가 추적하는 IssueFilters 필드
// 하나를 세팅한다 — 그래야 프리셋을 눌렀을 때 팝오버 배지에도 같이 반영된다. 필드 셋 중
// 정확히 하나만 채운다(동시에 여러 개를 채우지 않는다).
export type ExplorePreset = {
  key: string
  icon: ExplorePresetIcon
  label: string
  difficultyLevel?: ExperienceLevel
  contributionType?: ContributionType
  minStars?: StarThreshold
}

export const EXPLORE_PRESETS: ExplorePreset[] = [
  { key: 'good-first-issue', icon: 'sprout', label: '초보 환영', difficultyLevel: 'beginner' },
  { key: 'documentation', icon: 'doc', label: '문서 이슈', contributionType: 'doc' },
  { key: 'bug', icon: 'bug', label: '버그 수정', contributionType: 'bug' },
  { key: 'enhancement', icon: 'feat', label: '새 기능 제안', contributionType: 'feat' },
  { key: 'popular', icon: 'star', label: '인기 저장소', minStars: 1000 },
]

export type LanguageGroupPreset = {
  key: string
  label: string
  languages: string[]
}

// scoring-rules.ts의 LANGUAGE_GROUPS(웹/시스템/JVM/Apple 생태계 묶음)를 그대로 재사용한다 —
// 온보딩 채점 로직(scorer.ts)이 쓰는 것과 같은 분류라 사용자에게도 익숙하다. 인덱스로 라벨을
// 짝짓지 않고 각 묶음을 직접 지정해 LANGUAGE_GROUPS 순서가 바뀌어도 깨지지 않게 한다.
export const LANGUAGE_GROUP_PRESETS: LanguageGroupPreset[] = [
  { key: 'typescript', label: 'JS / TS', languages: LANGUAGE_GROUPS[0] },
  { key: 'c', label: 'C / C++', languages: LANGUAGE_GROUPS[1] },
  { key: 'java', label: 'Java / Kotlin', languages: LANGUAGE_GROUPS[2] },
  { key: 'swift', label: 'Swift / Obj-C', languages: LANGUAGE_GROUPS[3] },
]
