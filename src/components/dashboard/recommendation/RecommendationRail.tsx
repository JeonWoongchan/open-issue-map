import { unstable_cache } from 'next/cache'
import type { RecommendationCondition } from '@/constants/recommendation'
import {
  GITHUB_API_CACHE_TTL_SECONDS,
  RECOMMENDATION_PAGE_COUNT,
  RECOMMENDATION_PAGE_SIZE,
} from '@/constants/scoring-rules'
import { listUserBookmarkKeys } from '@/lib/bookmarks'
import { buildRecommendationCacheTag, fetchRecommendedIssues } from '@/lib/github/issues/recommendations'
import { withSingleFlight } from '@/lib/singleflight'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { IssueCardItem } from '@/types/issue'
import { RecommendationCarousel } from './RecommendationCarousel'
import { RecommendationRailShell } from './RecommendationRailShell'

type RecommendationRailProps = {
  condition: RecommendationCondition
  profile: OnboardingProfile
  accessToken: string
  userId: string | null
  isGuest: boolean
}

export async function RecommendationRail({ condition, profile, accessToken, userId, isGuest }: RecommendationRailProps) {
  // 새로고침해도 유지되도록 서버 캐시(Next.js Data Cache)에 저장한다 — 조건당 후보 풀 조회가
  // 대용량이라 매 방문마다 다시 기다리게 할 수 없음. "새로 추천받기"를 눌러야만
  // recommendation-actions.ts의 Server Action이 태그를 revalidate해서 다시 계산된다.
  const cacheUserId = userId ?? 'guest'
  const sortedLanguages = profile.topLanguages.slice().sort()
  const cacheKeyParts = ['recommendation-issues', cacheUserId, condition, ...sortedLanguages]

  // accessToken은 클로저로만 캡처하고 캐시된 함수의 인자로는 넘기지 않는다 — 인자로 넘기면
  // unstable_cache가 그 값을 캐시 키 계산에 자동으로 포함시켜, 같은 유저·조건이라도 토큰이
  // 바뀔 때마다 캐시가 갈라진다(readme.ts의 getContributingGuide가 겪은 것과 같은 함정).
  const getCachedIssues = unstable_cache(
    () => fetchRecommendedIssues(condition, profile, accessToken),
    cacheKeyParts,
    { revalidate: GITHUB_API_CACHE_TTL_SECONDS, tags: [buildRecommendationCacheTag(cacheUserId, condition)] }
  )

  // GitHub 쪽 일시적 오류(rate limit, resource limit, timeout 등)로 조건 하나가 실패해도
  // 페이지 전체가 죽지 않도록 이 레일만 격리해서 처리한다.
  let issues: IssueCardItem[] = []
  let fetchFailed = false

  try {
    const [scoredIssues, bookmarkKeys] = await Promise.all([
      withSingleFlight(cacheKeyParts.join('::'), getCachedIssues),
      userId ? listUserBookmarkKeys(userId) : Promise.resolve([]),
    ])

    const bookmarkKeySet = new Set(bookmarkKeys)
    issues = scoredIssues.map((issue) => ({
      ...issue,
      isBookmarked: bookmarkKeySet.has(`${issue.repoFullName}#${issue.number}`),
    }))
  } catch (error) {
    console.error(`[RecommendationRail] ${condition} 조회 실패:`, error)
    fetchFailed = true
  }

  return (
    <RecommendationRailShell condition={condition}>
      {fetchFailed ? (
        <p className="w-fit rounded-lg border border-status-danger-border bg-status-danger px-3 py-2 text-xs text-status-danger-foreground">
          지금은 GitHub에서 이 조건을 불러오지 못했어요. 잠시 후 &quot;새로 추천받기&quot;로 다시 시도해 주세요.
        </p>
      ) : issues.length > 0 ? (
        <RecommendationCarousel issues={issues} isGuest={isGuest} />
      ) : (
        <p className="w-fit rounded-lg border border-status-warning-border bg-status-warning px-3 py-2 text-xs text-status-warning-foreground">
          이번 프로필 조건에는 이 카테고리가 잘 맞지 않아요 — 표본 {RECOMMENDATION_PAGE_SIZE * RECOMMENDATION_PAGE_COUNT}건 중 조건을 통과한 이슈가 없어요.
        </p>
      )}
    </RecommendationRailShell>
  )
}
