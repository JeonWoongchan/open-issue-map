// 추천 이슈 페이지의 조회 조건. UI 레일 순서도 이 배열 순서를 그대로 따른다.
export const RECOMMENDATION_CONDITIONS = ['popular', 'latest'] as const
export type RecommendationCondition = typeof RECOMMENDATION_CONDITIONS[number]

export type RecommendationConditionMeta = {
  // GitHub search 쿼리의 sort qualifier 값 (예: "sort:created-desc")
  sort: string
  // 레일 상단의 짧은 라벨(uppercase로 표시)
  eyebrow: string
  title: string
  description: string
}

export const RECOMMENDATION_CONDITION_META: Record<RecommendationCondition, RecommendationConditionMeta> = {
  latest: {
    sort: 'created-desc',
    eyebrow: '최신 등록',
    title: '방금 올라온 이슈',
    description: '등록된 지 얼마 안 돼 아직 손 탄 사람이 적어요.',
  },
  popular: {
    sort: 'reactions-desc',
    eyebrow: '인기',
    title: '반응이 많은 이슈',
    description: '스타·리액션이 많은 저장소일수록 코드 품질 기준과 리뷰 문화가 안정적이에요.',
  },
}
