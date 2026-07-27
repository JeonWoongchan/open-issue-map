'use client'

import { useEffect, useState } from 'react'
import { IssueCard } from '@/components/dashboard/issue/IssueCard'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { useToast } from '@/hooks/use-toast'
import { getBookmarkFailureMessage, getBookmarkKey } from '@/hooks/useIssueBookmarks'
import { isUnauthorizedApiResponse, redirectToLogin } from '@/lib/client-auth'
import type { ApiResponse } from '@/types/api'
import type { IssueCardItem } from '@/types/issue'
import type { ContributionType } from '@/types/user'

type RecommendationCarouselProps = {
  issues: IssueCardItem[]
  isGuest: boolean
}

// react-query의 useQueryClient()는 이 카드들이 Suspense로 스트리밍되는 서버 컴포넌트 아래에서
// 렌더될 때 QueryClientProvider를 찾지 못해 "No QueryClient set" 오류를 던졌다 — 그래서
// useIssueBookmarks(react-query 기반) 대신 이 컴포넌트 안에서 낙관적 상태를 직접 관리한다.
// 대가: 여기서 북마크를 토글해도 /bookmarks, /profile 등 다른 페이지의 react-query 캐시는
// 즉시 갱신되지 않는다(그 페이지들의 자체 staleTime이 지나야 반영됨).
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
        body: JSON.stringify({
          issueNumber: issue.number,
          repoFullName: issue.repoFullName,
          issueTitle: issue.title,
          issueUrl: issue.url,
          contributionType: issue.contributionType as ContributionType | null,
        }),
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
    </Carousel>
  )
}
