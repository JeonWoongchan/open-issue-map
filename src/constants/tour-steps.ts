import type { Step } from 'react-joyride'

export const TOUR_IDS = {
    issueExplore: 'issue-explore',
} as const

export function getTourDoneKey(tourId: string): string {
    return `tour_done_${tourId}`
}

export const issueExploreTourSteps: Step[] = [
    {
        target: '#tour-search',
        title: '이슈 검색',
        content: 'GitHub 전체 이슈에서 검색해요. 검색어 없이 둘러보면 help wanted 이슈부터 보여드려요.',
        skipBeacon: true,
    },
    {
        target: '#tour-filter',
        title: '검색 필터',
        content: '언어, 난이도, 기여 방식, 진행 상태 등의 기준으로 검색 결과를 좁혀볼 수 있어요.',
        skipBeacon: true,
    },
    {
        target: '#tour-issue-list',
        title: '이슈 목록',
        content: '검색어가 없으면 최신순/인기순으로, 카드의 점수는 온보딩 결과를 반영한 매칭 점수예요. 카드를 클릭하면 자세한 내용을 확인할 수 있어요.',
        skipBeacon: true,
    },
    {
        target: '.tour-bookmark',
        title: '북마크',
        content: '관심 이슈를 저장해두고 북마크 페이지에서 다시 확인할 수 있어요.',
        skipBeacon: true,
    },
    {
        target: '#tour-help',
        title: '도움말',
        content: '카드 읽는 법, 추천 점수 산정 방식, AI 분석 방식에 대한 자세한 설명을 확인할 수 있어요.',
        skipBeacon: true,
    },
]
