'use client'

import { useState, useTransition } from 'react'
import { Clock, Flame } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { RECOMMENDATION_CONDITION_META, type RecommendationCondition } from '@/constants/recommendation'
import type { RecommendationRailData } from '@/lib/github/issues/recommendations'
import { refreshRecommendations } from '@/lib/recommendation-actions'
import { cn } from '@/lib/utils'
import { RecommendationCarousel } from './RecommendationCarousel'
import { RecommendationRefreshButton } from './RecommendationRefreshButton'
import { RecommendationSearchingState } from './RecommendationSearchingState'

const CONDITION_ICONS: Record<RecommendationCondition, typeof Clock> = {
  latest: Clock,
  popular: Flame,
}

type RecommendationRailShellProps = {
  condition: RecommendationCondition
  isGuest: boolean
  initialData: RecommendationRailData
}

// 새로고침 액션이 새 목록을 직접 반환하므로, 이 컴포넌트가 목록 상태를 직접 들고 있다가
// 그 결과로 교체한다 — router.refresh()로 서버 컴포넌트를 다시 그리게 만드는 간접 경로를 거치지 않는다.
export function RecommendationRailShell({ condition, isGuest, initialData }: RecommendationRailShellProps) {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState(initialData)
  const meta = RECOMMENDATION_CONDITION_META[condition]
  const Icon = CONDITION_ICONS[condition]

  function handleRefresh() {
    startTransition(async () => {
      setData(await refreshRecommendations(condition))
    })
  }

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-interactive-action uppercase">
            <Icon className="size-3.5" />
            {meta.eyebrow}
          </span>
          <h2 className="text-base font-bold">{meta.title}</h2>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <RecommendationRefreshButton isPending={isPending} onRefreshAction={handleRefresh} />
      </div>
      <Separator />
      <div className={cn('relative', isPending && 'min-h-40')}>
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <RecommendationSearchingState />
          </div>
        ) : data.fetchFailed ? (
          <p className="w-fit rounded-lg border border-status-danger-border bg-status-danger px-3 py-2 text-xs text-status-danger-foreground">
            지금은 이 조건을 불러오지 못했어요. 잠시 후 &quot;새로 추천받기&quot;로 다시 시도해 주세요.
          </p>
        ) : data.issues.length > 0 ? (
          <RecommendationCarousel issues={data.issues} isGuest={isGuest} />
        ) : (
          <p className="w-fit rounded-lg border border-status-warning-border bg-status-warning px-3 py-2 text-xs text-status-warning-foreground">
            이번 프로필 조건에는 이 카테고리가 잘 맞지 않아요 — 조건을 통과한 이슈가 없어요.
          </p>
        )}
      </div>
    </section>
  )
}
