import type { HelpGuideItem } from '@/types/help'
import type { ScoredIssue } from '@/types/issue'

export const DASHBOARD_HELP_GUIDE_ITEMS = [
  {
    id: 'score',
    title: '추천 점수',
    description:
      '설정과 선호에 이 이슈가 얼마나 잘 맞는지 빠르게 보여줘요.',
  },
  {
    id: 'stack',
    title: '기술 스택과 라벨',
    description:
      '언어, 난이도, 라벨을 함께 보면 이슈의 성격을 더 빠르게 파악할 수 있어요. 이미 PR이 연결된 이슈는 "PR 있음" 배지로 표시해서 중복 작업을 피할 수 있게 해줘요.',
  },
  {
    id: 'metrics',
    title: '반응과 규모',
    description:
      '저장소의 스타 수와 댓글 수를 함께 보여줘요. 진입 전에 프로젝트의 관심도와 논의 흐름을 가늠하는 데 도움이 돼요.',
  },
] as const satisfies readonly HelpGuideItem<string>[]

export type DashboardHelpGuideId = (typeof DASHBOARD_HELP_GUIDE_ITEMS)[number]['id']

export const DASHBOARD_HELP_DEMO_UPDATED_OFFSET_MS = 86_400_000

export const DASHBOARD_HELP_DEMO_ISSUE: Omit<ScoredIssue, 'createdAt' | 'updatedAt'> = {
  number: 12345,
  title: 'docs: clarify missing explanation in starter example',
  url: 'https://github.com/example/docs/issues',
  repoFullName: 'example/docs',
  repoUrl: 'https://github.com/example/docs',
  language: 'TypeScript',
  stargazerCount: 129000,
  labels: ['good first issue'],
  commentCount: 3,
  score: 82,
  difficultyLevel: 'beginner',
  contributionType: 'doc',
  competitionLevel: 'HAS_PR',
  hasPR: true,
  repoActivityLevel: 'active',
}
