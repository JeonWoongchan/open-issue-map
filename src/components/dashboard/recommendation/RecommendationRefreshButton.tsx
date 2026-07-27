'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RecommendationRefreshButtonProps = {
  isPending: boolean
  onRefresh: () => void
}

// isPending/onRefresh를 상위(RecommendationRailShell)에서 받는 제어 컴포넌트로 유지한다 —
// 카드 영역의 로딩 표시(RecommendationSearchingState)와 같은 isPending을 공유해야 해서
// 이 버튼이 자체적으로 useTransition을 소유하면 두 상태가 어긋난다.
export function RecommendationRefreshButton({ isPending, onRefresh }: RecommendationRefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onRefresh}
      disabled={isPending}
      aria-label="이 레일 새로 추천받기"
    >
      <RefreshCw className={cn('size-3.5', isPending && 'animate-spin')} />
    </Button>
  )
}
