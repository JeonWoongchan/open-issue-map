'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RecommendationRefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <Button type="button" variant="interactive" size="sm" onClick={handleClick} disabled={isPending}>
      <RefreshCw className={cn('size-3.5', isPending && 'animate-spin')} />
      새로 추천받기
    </Button>
  )
}
