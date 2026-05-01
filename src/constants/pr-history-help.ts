import type { HelpGuideItem } from '@/types/help'
import type { PullRequestItem } from '@/types/pull-request'

export const PR_HISTORY_HELP_GUIDE_ITEMS = [
    {
        id: 'state',
        title: 'PR 상태',
        description:
            '진행 중 · 병합됨 · 닫힘 세 가지로 표시돼요. 병합됨은 코드가 실제로 반영된 기여이고, 닫힘은 병합 없이 종료된 PR이에요.',
    },
    {
        id: 'tags',
        title: '언어와 라벨',
        description:
            '기여한 저장소의 주 언어와 PR에 붙은 라벨이에요. 어떤 영역에 기여했는지 한눈에 볼 수 있어요.',
    },
    {
      id: 'code-diff',
      title: '코드 변경량',
      description:
        '초록색 숫자는 추가한 줄 수, 빨간색 숫자는 삭제한 줄 수예요. 변경 규모를 빠르게 확인할 수 있어요.',
    },
] as const satisfies readonly HelpGuideItem<string>[]

export type PRHistoryHelpGuideId = (typeof PR_HISTORY_HELP_GUIDE_ITEMS)[number]['id']

export const PR_HISTORY_HELP_DEMO_OFFSET_MS = 2_592_000_000 // 30일

export const PR_HISTORY_HELP_DEMO_PR: Omit<PullRequestItem, 'createdAt'> = {
    title: 'feat: implement search filter for issue discovery dashboard',
    url: 'https://github.com/vercel/next.js/pull/12345',
    state: 'MERGED',
    mergedAt: null,
    closedAt: null,
    additions: 234,
    deletions: 56,
    changedFiles: 8,
    commentCount: 4,
    reviewCount: 2,
    commitCount: 3,
    labels: ['enhancement', 'typescript'],
    repoFullName: 'vercel/next.js',
    repoUrl: 'https://github.com/vercel/next.js',
    stargazerCount: 129000,
    language: 'TypeScript',
}
