import { LANGUAGE_GROUPS } from './scoring-rules'
import type { StarThreshold } from './scoring-rules'

// 이슈 탐색 페이지 검색창 위에 노출하는 아이콘 프리셋 — 아이콘 키는 public/icons/filters/의
// SVG 파일명과 1:1 대응하며, IssueSearchPresets.tsx가 그 경로를 그대로 <img>로 참조한다.
export type ExplorePresetIcon = 'sprout' | 'doc' | 'bug' | 'feat' | 'star'

export type ExplorePreset = {
  key: string
  icon: ExplorePresetIcon
  label: string
  // 설정되면 검색 쿼리에 label:"..."로 실려간다. minStars와는 동시에 설정하지 않는다.
  githubLabel?: string
  // 설정되면 GitHub 쿼리가 아니라 후처리 필터(IssueFilters.minStars)로 적용된다 —
  // stars: qualifier가 이슈 검색에서 동작하지 않기 때문(search.ts 참고).
  minStars?: StarThreshold
}

export const EXPLORE_PRESETS: ExplorePreset[] = [
  { key: 'good-first-issue', icon: 'sprout', label: '초보 환영', githubLabel: 'good first issue' },
  { key: 'documentation', icon: 'doc', label: '문서 이슈', githubLabel: 'documentation' },
  { key: 'bug', icon: 'bug', label: '버그 수정', githubLabel: 'bug' },
  { key: 'enhancement', icon: 'feat', label: '새 기능 제안', githubLabel: 'enhancement' },
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
