import type { CompetitionLevel } from '@/types/issue'
import type { ContributionType, ExperienceLevel, Purpose, WeeklyHours } from '@/types/user'

// ****규칙을 명확한 기준으로 재정비할 필요가 있음****
// GitHub Search API로 후보 이슈를 가져온 뒤, 아래 규칙으로 사용자 온보딩 답변과 이슈 메타데이터를 비교한다.
// 최종 score는 카드 우측 상단의 매칭 점수로 노출되며, 높은 점수일수록 사용자 설정에 더 잘 맞는 이슈로 본다.
export const PAGE_SIZE = 10
// AI 분석 요청 시 전송할 이슈 본문 최대 길이
export const ISSUE_BODY_PREVIEW_LENGTH = 500
export const MATCH_SCORE_MINIMUM = 0
// 이슈 목록에 노출할 최소 점수 — 미달 이슈는 랭킹 단계에서 제거
export const RANK_SCORE_THRESHOLD = 50
// 추천 이슈 페이지의 큐레이션 캐러셀에 노출할 최소 점수
export const RECOMMENDATION_SCORE_THRESHOLD = 70
// 추천 이슈 페이지가 조회 조건 1개당 GitHub에 요청하는 페이지 크기(GraphQL first)
export const RECOMMENDATION_PAGE_SIZE = 100
// resource limit이면 실패한 커서만 50개로 재시도하되, 최종 후보 목표는 300개로 유지한다.
export const RECOMMENDATION_FALLBACK_PAGE_SIZE = 50
export const RECOMMENDATION_TARGET_POOL_SIZE = 300
// 오류나 시간 예산 소진 시 이만큼 확보했으면 부분 결과를 저장하고, 미만이면 기존 DB 풀을 보존한다.
export const RECOMMENDATION_MIN_POOL_SIZE = 150
// 정상 경로(100개 × 3회)는 그대로 허용하되, resource-limit fallback은
// 100개 실패 1회 + 50개 3회까지만 허용한다. 한 언어가 GitHub 계산 자원을
// 오래 독점하지 않게 하면서 최소 후보 풀 150개는 확보할 수 있는 상한이다.
export const RECOMMENDATION_MAX_FETCH_REQUESTS = 4
// 함수 제한 45초 중 DB 저장과 응답에 7초를 남긴다.
export const RECOMMENDATION_FETCH_BUDGET_MS = 38_000
// 캐러셀 한 레일에서 같은 저장소가 노출되는 최대 개수 — 활발한 저장소 하나가 레일을 독점하는 것을 막는다.
// 저장소당 후보가 이 값보다 많으면 그중 무작위로 골라, "새로 추천받기"를 눌렀을 때 같은 조합만 반복되지 않게 한다
export const RECOMMENDATION_MAX_PER_REPO = 3
// 추천 이슈 레일 하나에 최종 노출할 최대 개수
export const RECOMMENDATION_DISPLAY_LIMIT = 15
// 이슈 데이터 캐시 TTL — 추천 목적상 실시간 반영보다 rate limit 절약과 재방문 UX를 우선해 30분으로 설정
export const GITHUB_API_CACHE_TTL_SECONDS = 1800
// GitHub API 응답 대기 상한 — 초과 시 AbortError로 함수 조기 종료
export const GITHUB_API_TIMEOUT_MS = 8_000
// 이슈 검색(searchIssues) 전용 상한 — full 필드 선택(body/comments/reactions/labels/repository/
// timelineItems)을 first:100으로 조회하는 무거운 쿼리라, Java처럼 결과가 많은 언어에서는 실측상
// 5~6초는 기본이고 종종 8초를 넘겨 GITHUB_API_TIMEOUT_MS로 중도 취소되는 게 확인됐다(재현 완료).
// 크론 라우트의 maxDuration(45초, 페이지 3회 순차 호출)에 맞춰 3회를 곱해도 여유가 남도록 12초로 설정.
export const GITHUB_SEARCH_TIMEOUT_MS = 12_000
// 이슈 목록 클라이언트 stale 시간 — 서버 캐시 TTL과 맞춰 재방문 시 즉시 표시
export const ISSUE_LIST_STALE_TIME_MS = GITHUB_API_CACHE_TTL_SECONDS * 1000
// 저장소 활성도 판별 기준
// pushedAt 경과일과 reactions 수를 조합해 3단계 구분
export const REPO_ACTIVITY_THRESHOLDS = {
  ACTIVE_PUSH_DAYS: 30,
  ACTIVE_COMMUNITY_PUSH_DAYS: 90,
  MODERATE_PUSH_DAYS: 180,
  COMMUNITY_BOOST_SIGNAL: 5,
} as const

// 온보딩의 선호 언어와 GitHub 저장소 primaryLanguage를 비교한다.
// 선택한 언어이면 순위 무관하게 동일 점수를 주고, 같은 계열 언어는 부분 점수를 준다.
export const LANGUAGE_SCORE = {
  EXACT: 28,
  RELATED: 15,
  NO_MATCH: 0,
} as const

// GitHub의 primaryLanguage는 하나만 오기 때문에, 사용자가 선택한 언어와 같은 생태계면 related match로 본다.
export const LANGUAGE_GROUPS: string[][] = [
  ['TypeScript', 'JavaScript'],                  // 웹/Node.js 생태계
  ['C', 'C++'],                                  // 시스템·임베디드 (C#은 .NET으로 별도)
  ['Java', 'Kotlin', 'Scala', 'Groovy'],         // JVM 생태계
  ['Swift', 'Objective-C'],                      // Apple 플랫폼 (iOS/macOS)
  ['Python'],                                    // 단독 — 온보딩 선택지(POPULAR_LANGUAGES)에 있으나 뚜렷한 동일 생태계 묶음이 없음
  ['Rust'],                                      // 단독
  ['Go'],                                        // 단독
  ['C#'],                                        // 단독 — .NET 생태계, 위 C/C++ 그룹과 다름
  ['Ruby'],                                      // 단독
  ['PHP'],                                       // 단독 — Ruby와 생태계가 달라 함께 묶지 않음
]

// 온보딩의 오픈소스 기여 경험과 이슈 난이도 추정값을 비교한다.
// 사용자 수준과 같은 난이도가 가장 좋고, 한 단계 높은 이슈는 도전 가능한 이슈로 일부 가산한다.
export const DIFFICULTY_SCORE = {
  PERFECT: 23,
  ONE_ABOVE: 12,
  TWO_ABOVE: 6,
  THREE_ABOVE: 0,
  ONE_BELOW: 8,
  TWO_BELOW: 4,
  THREE_BELOW: 0,
} as const

// 난이도 라벨 없음(UNKNOWN) 점수 — 경험 수준별로 다르게 해석한다.
// good first issue 라벨은 "쉽다"는 명시적 신호이므로 라벨 부재는 쉬운 이슈가 아닐 가능성이 높다.
// 수준이 높을수록 라벨 없음은 오히려 적합 신호에 가까우므로 점수를 높게 부여한다.
// 경험 수준 미설정(null) 시에는 junior 값을 중립 기본값으로 사용한다.
export const DIFFICULTY_UNKNOWN_BY_LEVEL: Record<ExperienceLevel, number> = {
  beginner: 10,
  junior: 14,
  mid: 19,
  senior: 19,
} as const

export const EXPERIENCE_ORDER: ExperienceLevel[] = ['beginner', 'junior', 'mid', 'senior']

// GitHub가 난이도를 공식 필드로 주지 않기 때문에 이슈 라벨 키워드로 난이도를 추정한다.
// 'help wanted'는 기여 요청 레이블이므로 난이도 신호로 사용하지 않는다.
// 'needs-investigation'은 상태 레이블이므로 난이도 신호로 사용하지 않는다.
export const DIFFICULTY_LABELS: Record<ExperienceLevel, string[]> = {
  beginner: [
    'good first issue', 'good-first-issue',
    'good first issues', 'good-first-issues',
    'first-timers-only', 'first timers only',
    'mentored',
    'beginner', 'starter', 'easy',
    'difficulty:easy', 'difficulty: easy', 'difficulty:beginner',
  ],
  junior: [
    'good second issue', 'good-second-issue',
    'junior',
    'e-mentored',
  ],
  mid: [
    'medium', 'moderate', 'intermediate',
    'difficulty:medium', 'difficulty: medium',
    'e-medium',
  ],
  senior: [
    'hard', 'complex', 'advanced',
    'difficulty:hard', 'difficulty: hard',
    'difficulty:expert',
    'e-hard',
  ],
}

// 온보딩의 기여 방식 답변과 이슈의 작업 성격을 매칭하기 위한 키워드다.
// GitHub issue type이 항상 설정되어 있지 않으므로 라벨, 제목, 본문을 함께 탐색한다.
export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string[]> = {
  doc: ['documentation', 'docs', 'readme', 'translation', 'i18n'],
  // crash·[bug]·bug: 는 제목에서 오탐이 적은 명시적 버그 신호
  bug: ['bug', 'fix', 'regression', 'defect', 'error', 'crash', '[bug]', 'bug:'],
  // feat:·[feature]·feature: 는 conventional commit 및 명시적 기능 요청 신호
  feat: ['feature', 'enhancement', 'feature-request', 'proposal', 'feat:', '[feature]', 'feature:'],
  test: ['test', 'testing', 'coverage', 'qa'],
  review: ['review', 'feedback'],
}

// 사용자가 선택한 기여 방식과 추정된 이슈 작업 성격이 같으면 가산한다.
// UNKNOWN: 라벨·텍스트로 기여 방식을 감지할 수 없음 — 선택한 방식에 해당할 가능성이 있어 부분 점수를 부여한다.
//   MATCH(16)와 격차를 3점으로 유지 — 정보 부재는 불일치가 아니므로 NO_MATCH(0)와 명확히 구분한다.
// NO_MATCH: 기여 방식이 감지됐지만 선택한 방식과 다름 — 점수 없음.
export const CONTRIBUTION_TYPE_SCORE = {
  MATCH: 16,
  NO_MATCH: 0,
  UNKNOWN: 13,
} as const

// 댓글 수와 PR 연결 여부로 진입 경쟁도를 추정한다.
// 이미 PR이 있거나 토론이 많은 이슈는 초보자가 들어가기 어려울 수 있어 기본 감점한다.
export const COMPETITION_PENALTY = {
  PR_EXISTS: -10,
  NO_COMMENT: 4,
  ONE_COMMENT: 3,
  MEDIUM_ACTIVITY: -2,
  HIGH_ACTIVITY: -6,
  VERY_HIGH_ACTIVITY: -10,
} as const

// 전역 저장소 인지도 점수 — star 수가 많을수록 커뮤니티 활성도가 높다고 보고 가산 (최대 4점)
export const REPO_STAR_SCORE_TIERS = [
  { stars: 3000, score: 4 },
  { stars: 1000, score: 3 },
  { stars: 300, score: 2 },
  { stars: 100, score: 1 },
] as const

// 경험 수준은 난이도뿐 아니라 경쟁도와도 연결된다.
// 입문자는 OPEN 이슈를 더 선호하고, 경험이 높을수록 ACTIVE 이슈도 감당 가능하다고 본다.
export const EXPERIENCE_COMPETITION_BONUS: Record<
  ExperienceLevel,
  Record<CompetitionLevel, number>
> = {
  beginner: {
    OPEN: 4,
    ACTIVE: -2,
    HAS_PR: -8,
  },
  junior: {
    OPEN: 4,
    ACTIVE: 3,
    HAS_PR: -5,
  },
  mid: {
    OPEN: 3,
    ACTIVE: 8,
    HAS_PR: -2,
  },
  senior: {
    OPEN: 3,
    ACTIVE: 8,
    HAS_PR: 0,
  },
}

// 온보딩의 작업 시간 답변을 이슈 메타데이터에 반영하는 규칙이다.
// 일치 시 가산만 하고 불일치 감점은 없다.
export const TIME_BUDGET_RULES: Record<
  WeeklyHours,
  {
    preferredTypes: ContributionType[]
    preferredDifficulties: ExperienceLevel[]
    preferredMaxComments: number
    typeMatchBonus: number
    difficultyMatchBonus: number
    lowCommentBonus: number
  }
> = {
  2: {
    preferredTypes: ['doc', 'bug'],
    preferredDifficulties: ['beginner', 'junior'],
    preferredMaxComments: 2,
    typeMatchBonus: 3,
    difficultyMatchBonus: 2,
    lowCommentBonus: 2,
  },
  5: {
    preferredTypes: ['doc', 'bug', 'test'],
    preferredDifficulties: ['beginner', 'junior', 'mid'],
    preferredMaxComments: 5,
    typeMatchBonus: 3,
    difficultyMatchBonus: 2,
    lowCommentBonus: 2,
  },
  10: {
    preferredTypes: ['doc', 'bug', 'test', 'feat', 'review'],
    preferredDifficulties: ['beginner', 'junior', 'mid', 'senior'],
    preferredMaxComments: 8,
    typeMatchBonus: 3,
    difficultyMatchBonus: 2,
    lowCommentBonus: 1,
  },
}

// 기여 목적은 GitHub API가 직접 주는 값이 아니므로 제품 정책으로 해석한다.
// portfolio: 결과물을 설명하기 쉬운 유명/건강한 저장소와 진입 가능한 작업을 우대
// growth: 학습 효과가 큰 기능/테스트/버그, 약간 도전적인 난이도를 우대
// community: 유지보수가 활발하고 꾸준히 참여하기 좋은 저장소와 작업을 우대
export const PURPOSE_SCORE_RULES: Record<
  Purpose,
  {
    openCompetitionBonus: number
    activeCompetitionBonus: number
    preferredTypes: ContributionType[]
    preferredDifficulties: ExperienceLevel[]
    preferredTypeBonus: number
    preferredDifficultyBonus: number
    // 포트폴리오 목적에서 인지도 있는 저장소에 추가 가산 — 0이면 미적용
    recognizedRepoStars: number
    recognizedRepoBonus: number
  }
> = {
  portfolio: {
    openCompetitionBonus: 3,
    activeCompetitionBonus: 2,
    preferredTypes: ['doc', 'bug', 'feat'],
    preferredDifficulties: ['beginner', 'junior'],
    preferredTypeBonus: 3,
    preferredDifficultyBonus: 3,
    recognizedRepoStars: 300,
    recognizedRepoBonus: 5,
  },
  growth: {
    openCompetitionBonus: 2,
    // 학습·도전 목적이므로 토론이 진행 중인 ACTIVE 이슈에 더 높은 가산
    activeCompetitionBonus: 4,
    preferredTypes: ['feat', 'test', 'bug'],
    preferredDifficulties: ['junior', 'mid', 'senior'],
    preferredTypeBonus: 3,
    preferredDifficultyBonus: 3,
    recognizedRepoStars: 0,
    recognizedRepoBonus: 0,
  },
  community: {
    openCompetitionBonus: 3,
    activeCompetitionBonus: 2,
    preferredTypes: ['doc', 'bug', 'test'],
    preferredDifficulties: ['beginner', 'junior', 'mid'],
    preferredTypeBonus: 3,
    preferredDifficultyBonus: 3,
    recognizedRepoStars: 0,
    recognizedRepoBonus: 0,
  },
}

export const SCORE_FILTER_THRESHOLDS = [50, 60, 70, 80, 90] as const
export type ScoreThreshold = typeof SCORE_FILTER_THRESHOLDS[number]

export const STAR_FILTER_THRESHOLDS = [100, 300, 1000, 3000] as const
export type StarThreshold = typeof STAR_FILTER_THRESHOLDS[number]

// 이슈 탐색 페이지 — 배치가 열리자마자(offset=0) 보여줄 분량. 사용자가 직접 기다리는
// 유일한 요청이므로 작게 유지한다.
export const EXPLORE_FOREGROUND_FETCH_SIZE = 30
// 배치 시작과 동시에 background로 미리 채워두는 분량 — 사용자는 기다리지 않으므로 크게 잡는다.
// foreground와 같은 커서에서 fetch하므로(0..89) foreground(0..29)를 그대로 포함한다.
export const EXPLORE_BACKGROUND_FETCH_SIZE = 90
// 첫 배치를 나타내는 sentinel — 커서 없이 GitHub 첫 페이지를 요청한다.
export const EXPLORE_INITIAL_BATCH = 'initial' as const

// "인기순" 정렬(reactions-desc)의 리소스 리밋 회피용 창 — reactions 기준 정렬은 GitHub이
// 전체 이력을 집계해야 해서 비용이 커 "Resource limits for this query exceeded"로 거부되기
// 쉽다. 최근 N일로 후보 풀을 좁혀 비용을 낮춘다. 이슈 탐색 페이지(search.ts)와 추천 이슈
// 페이지(recommendations.ts) 둘 다 reactions-desc를 쓰므로 이 상수를 공유한다.
export const POPULAR_SORT_WINDOW_DAYS = 90
