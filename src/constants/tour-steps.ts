import type { Step } from 'react-joyride'

export const TOUR_IDS = {
    dashboard: 'dashboard',
} as const

export function getTourDoneKey(tourId: string): string {
    return `tour_done_${tourId}`
}

export const dashboardTourSteps: Step[] = [
    {
        target: '#tour-search',
        title: '이슈 검색',
        content: '키워드로 이슈 제목을 검색할 수 있어요.',
        skipBeacon: true,
    },
    {
        target: '#tour-filter',
        title: '필터링',
        content: '언어, 경험 수준, 기여 유형, 활동성 기준으로 이슈를 좁혀볼 수 있어요.',
        skipBeacon: true,
    },
    {
        target: '#tour-issue-list',
        title: '추천 이슈',
        content: '관심사와 기술 수준을 바탕으로 기여하기 좋은 이슈를 카드로 보여드려요. 제목을 클릭하면 GitHub으로 이동합니다.',
        skipBeacon: true,
    },
    {
        target: '.tour-bookmark',
        title: '북마크',
        content: '관심 이슈를 저장해두고 북마크 페이지에서 다시 확인할 수 있어요.',
        skipBeacon: true,
    },
    {
        target: '.tour-ai-btn',
        title: 'AI 분석',
        content: 'AI가 이슈를 분석해 예상 작업 범위, 필요한 개념, 먼저 봐야 할 파일을 안내해줘요.',
        skipBeacon: true,
    },
    {
        target: '#tour-help',
        title: '도움말',
        content: '카드 읽는 법, 추천 점수 산정 방식, AI 분석 방식에 대한 자세한 설명을 확인할 수 있어요.',
        skipBeacon: true,
    },
]
