'use client'

import { useEffect, useState } from 'react'
import { IssueCard } from '@/components/dashboard/issue/IssueCard'
import { Carousel, CarouselContent, CarouselItem, useCarousel } from '@/components/ui/carousel'
import { useToast } from '@/hooks/use-toast'
import { buildBookmarkToggleBody, getBookmarkFailureMessage, getBookmarkKey } from '@/hooks/useIssueBookmarks'
import { isUnauthorizedApiResponse, redirectToLogin } from '@/lib/client-auth'
import type { ApiResponse } from '@/types/api'
import type { IssueCardItem } from '@/types/issue'

type RecommendationCarouselProps = {
  issues: IssueCardItem[]
  isGuest: boolean
}

// 더 스크롤할 카드가 있는 쪽에만 가장자리를 은은하게 페이드아웃 — canScrollPrev/Next는
// useCarousel()이 embla의 select 이벤트에 맞춰 이미 추적 중이라 별도 계산 없이 그대로 쓴다.
// <Carousel> 내부(Provider 아래)에서만 렌더돼야 하므로 별도 컴포넌트로 분리한다.
function CarouselEdgeFade() {
  const { canScrollPrev, canScrollNext } = useCarousel()

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent transition-opacity duration-300 ${canScrollPrev ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-300 ${canScrollNext ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}

export function RecommendationCarousel({ issues, isGuest }: RecommendationCarouselProps) {
  const { toast } = useToast()
  const [optimisticIssues, setOptimisticIssues] = useState(issues)

  useEffect(() => {
    setOptimisticIssues(issues)
  }, [issues])

  async function handleToggleBookmark(issue: IssueCardItem) {
    if (isGuest) {
      toast({ title: '로그인 후 이용 가능한 기능이에요.' })
      return
    }

    const bookmarkKey = getBookmarkKey(issue)
    const wasBookmarked = issue.isBookmarked ?? false

    function setBookmarked(value: boolean) {
      setOptimisticIssues((current) =>
        current.map((i) => (getBookmarkKey(i) === bookmarkKey ? { ...i, isBookmarked: value } : i))
      )
    }

    setBookmarked(!wasBookmarked)

    try {
      const response = await fetch('/api/bookmarks', {
        method: wasBookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBookmarkToggleBody(issue, wasBookmarked)),
      })
      const json = (await response.json()) as ApiResponse<{ saved?: boolean; deleted?: boolean }>

      if (isUnauthorizedApiResponse(response, json)) {
        redirectToLogin()
        setBookmarked(wasBookmarked)
        return
      }

      if (!response.ok || !json.ok) {
        toast({ variant: 'destructive', title: getBookmarkFailureMessage(wasBookmarked) })
        setBookmarked(wasBookmarked)
        return
      }

      toast({ variant: 'success', title: wasBookmarked ? '북마크가 제거되었습니다.' : '북마크가 저장되었습니다.' })
    } catch {
      toast({ variant: 'destructive', title: getBookmarkFailureMessage(wasBookmarked) })
      setBookmarked(wasBookmarked)
    }
  }

  return (
    <Carousel opts={{ align: 'start', dragFree: true }}>
      <CarouselContent className="-ml-3.5 py-3">
        {optimisticIssues.map((issue) => (
          <CarouselItem key={`${issue.repoFullName}#${issue.number}`} className="basis-[280px] pl-3.5">
            <IssueCard issue={issue} onToggleBookmark={handleToggleBookmark} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselEdgeFade />
    </Carousel>
  )
}
