import { Clock, Flame } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { RECOMMENDATION_CONDITION_META, type RecommendationCondition } from '@/constants/recommendation'
import { RECOMMENDATION_PAGE_COUNT, RECOMMENDATION_PAGE_SIZE } from '@/constants/scoring-rules'
import { listUserBookmarkKeys } from '@/lib/bookmarks'
import { fetchRecommendedIssues } from '@/lib/github/issues/recommendations'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { IssueCardItem } from '@/types/issue'
import { RecommendationCarousel } from './RecommendationCarousel'

const CONDITION_ICONS: Record<RecommendationCondition, typeof Clock> = {
  latest: Clock,
  popular: Flame,
}

type RecommendationRailProps = {
  condition: RecommendationCondition
  profile: OnboardingProfile
  accessToken: string
  userId: string | null
  isGuest: boolean
}

export async function RecommendationRail({ condition, profile, accessToken, userId, isGuest }: RecommendationRailProps) {
  const meta = RECOMMENDATION_CONDITION_META[condition]
  const Icon = CONDITION_ICONS[condition]

  // GitHub 쪽 일시적 오류(rate limit, resource limit, timeout 등)로 조건 하나가 실패해도
  // 페이지 전체가 죽지 않도록 이 레일만 격리해서 처리한다.
  let issues: IssueCardItem[] = []
  let fetchFailed = false

  try {
    const [scoredIssues, bookmarkKeys] = await Promise.all([
      fetchRecommendedIssues(condition, profile, accessToken),
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
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-interactive-action uppercase">
          <Icon className="size-3.5" />
          {meta.eyebrow}
        </span>
        <h2 className="text-base font-bold">{meta.title}</h2>
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      </div>
      <Separator />
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
    </section>
  )
}
