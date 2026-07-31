import type { HelpGuideItem } from '@/types/help'
import type { IssueCardItem } from '@/types/issue'

export const BOOKMARK_HELP_GUIDE_ITEMS = [
  {
    id: 'snapshot',
    title: '카드 정보는 북마크한 시점 기준이에요',
    description:
      '언어, 라벨, 댓글 수, 추천 점수 같은 정보는 북마크할 때의 값을 그대로 저장해서 보여줘요. 그 이후 GitHub에서 값이 바뀌어도(새 댓글, PR 연결 등) 여기엔 반영되지 않아요.',
  },
  {
    id: 'check-latest',
    title: '최신 상태는 제목을 눌러 확인하세요',
    description:
      '제목을 누르면 GitHub의 실제 이슈 페이지로 이동해요. 지금 상태가 궁금하면 거기서 확인해 주세요.',
  },
] as const satisfies readonly HelpGuideItem<string>[]

export type BookmarkHelpGuideId = (typeof BOOKMARK_HELP_GUIDE_ITEMS)[number]['id']

// 데모 카드에 "N일 전 북마크함"으로 표시할 오프셋
export const BOOKMARK_HELP_DEMO_UPDATED_OFFSET_MS = 172_800_000

export const BOOKMARK_HELP_DEMO_ISSUE: Omit<IssueCardItem, 'createdAt' | 'updatedAt'> = {
  number: 2048,
  title: 'docs: broken link in getting-started guide',
  url: 'https://github.com/example/docs/issues/2048',
  repoFullName: 'example/docs',
  repoUrl: 'https://github.com/example/docs',
  language: 'TypeScript',
  stargazerCount: 74000,
  labels: ['good first issue'],
  commentCount: 2,
  body: 'The starter example in docs/getting-started.md skips over how the config file is resolved, which has confused a few new contributors.',
  score: 78,
  difficultyLevel: 'beginner',
  contributionType: 'doc',
  competitionLevel: 'OPEN',
  hasPR: false,
  repoActivityLevel: 'active',
  isBookmarked: true,
}
