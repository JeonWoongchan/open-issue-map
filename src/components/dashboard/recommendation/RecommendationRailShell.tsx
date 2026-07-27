'use client'

import { useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Flame } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { RECOMMENDATION_CONDITION_META, type RecommendationCondition } from '@/constants/recommendation'
import { refreshRecommendations } from '@/lib/recommendation-actions'
import { cn } from '@/lib/utils'
import { RecommendationRefreshButton } from './RecommendationRefreshButton'
import { RecommendationSearchingState } from './RecommendationSearchingState'

const CONDITION_ICONS: Record<RecommendationCondition, typeof Clock> = {
  latest: Clock,
  popular: Flame,
}

type RecommendationRailShellProps = {
  condition: RecommendationCondition
  children: ReactNode
}

// 헤더의 새로고침 버튼과 카드 영역은 서로 다른 위치에 있지만 같은 isPending 상태를 공유해야
// 로딩 중에 카드 자리를 RecommendationSearchingState로 바꿔치기할 수 있다 — 그래서 이 클라이언트
// 컴포넌트가 둘 다 감싸며 useTransition을 한 곳에서만 소유한다. 실제 데이터 조회(캐싱 포함)는
// 여전히 서버 컴포넌트인 RecommendationRail이 하고, 결과 JSX만 children으로 받는다.
export function RecommendationRailShell({ condition, children }: RecommendationRailShellProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const meta = RECOMMENDATION_CONDITION_META[condition]
  const Icon = CONDITION_ICONS[condition]

  function handleRefresh() {
    startTransition(async () => {
      // 서버 캐시(unstable_cache) 태그를 먼저 무효화한 뒤 재실행해야 새로운 조합이 계산된다 —
      // router.refresh()만 부르면 캐시가 안 무효화된 상태라 같은 결과가 그대로 다시 나온다.
      await refreshRecommendations(condition)
      router.refresh()
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
        <RecommendationRefreshButton isPending={isPending} onRefresh={handleRefresh} />
      </div>
      <Separator />
      <div className={cn('relative', isPending && 'min-h-40')}>
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <RecommendationSearchingState />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
