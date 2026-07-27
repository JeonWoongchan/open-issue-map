'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RecommendationCondition } from '@/constants/recommendation'
import { refreshRecommendations } from '@/lib/recommendation-actions'
import { cn } from '@/lib/utils'

type RecommendationRefreshButtonProps = {
  condition: RecommendationCondition
}

export function RecommendationRefreshButton({ condition }: RecommendationRefreshButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      // 서버 캐시(unstable_cache) 태그를 먼저 무효화한 뒤 재실행해야 새로운 조합이 계산된다 —
      // router.refresh()만 부르면 캐시가 안 무효화된 상태라 같은 결과가 그대로 다시 나온다.
      await refreshRecommendations(condition)
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label="이 레일 새로 추천받기"
    >
      <RefreshCw className={cn('size-3.5', isPending && 'animate-spin')} />
    </Button>
  )
}
