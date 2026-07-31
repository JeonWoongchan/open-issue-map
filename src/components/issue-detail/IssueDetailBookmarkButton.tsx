'use client'

import { useState } from 'react'
import { BookmarkButton } from '@/components/shared/issue-card/BookmarkButton'
import { useToast } from '@/hooks/use-toast'
import { buildBookmarkToggleBody, getBookmarkFailureMessage } from '@/hooks/useIssueBookmarks'
import { isUnauthorizedApiResponse, redirectToLogin } from '@/lib/client-auth'
import type { ApiResponse } from '@/types/api'
import type { IssueCardItem } from '@/types/issue'

type IssueDetailBookmarkButtonProps = {
  issue: IssueCardItem
  isGuest: boolean
}

// 이 페이지 하나만 렌더되는 단일 이슈용 북마크 토글 — RecommendationCarousel과 같은 이유로
// react-query 기반 useIssueBookmarks 대신 로컬 상태로 직접 구현한다(목록이 아니라 항목 1개뿐이라
// 그 훅의 배열 동기화 로직이 필요 없기도 하다).
export function IssueDetailBookmarkButton({ issue, isGuest }: IssueDetailBookmarkButtonProps) {
  const { toast } = useToast()
  const [current, setCurrent] = useState(issue)

  async function handleToggle(target: IssueCardItem) {
    if (isGuest) {
      toast({ title: '로그인 후 이용 가능한 기능이에요.' })
      return
    }

    const wasBookmarked = target.isBookmarked ?? false
    setCurrent((prev) => ({ ...prev, isBookmarked: !wasBookmarked }))

    try {
      const response = await fetch('/api/bookmarks', {
        method: wasBookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBookmarkToggleBody(target, wasBookmarked)),
      })
      const json = (await response.json()) as ApiResponse<{ saved?: boolean; deleted?: boolean }>

      if (isUnauthorizedApiResponse(response, json)) {
        redirectToLogin()
        setCurrent((prev) => ({ ...prev, isBookmarked: wasBookmarked }))
        return
      }

      if (!response.ok || !json.ok) {
        toast({ variant: 'destructive', title: getBookmarkFailureMessage(wasBookmarked) })
        setCurrent((prev) => ({ ...prev, isBookmarked: wasBookmarked }))
        return
      }

      toast({ variant: 'success', title: wasBookmarked ? '북마크가 제거되었습니다.' : '북마크가 저장되었습니다.' })
    } catch {
      toast({ variant: 'destructive', title: getBookmarkFailureMessage(wasBookmarked) })
      setCurrent((prev) => ({ ...prev, isBookmarked: wasBookmarked }))
    }
  }

  return <BookmarkButton issue={current} onToggleBookmarkAction={handleToggle} />
}
