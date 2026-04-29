'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { SearchBar } from '@/components/shared/SearchBar'
import { SearchDataListState } from '@/components/shared/SearchDataListState'
import { CardListSkeleton } from '@/components/shared/CardListSkeleton'
import { BookmarkHelpDialog } from '@/components/bookmark/bookmark-help/BookmarkHelpDialog'
import { useBookmarkList } from '@/hooks/useBookmarkList'
import { useIssueBookmarks } from '@/hooks/useIssueBookmarks'
import { useSearchFilter } from '@/hooks/useSearchFilter'
import { useScrollSentinel } from '@/hooks/useScrollSentinel'
import { BookmarkListContent } from './BookmarkListContent'

export function BookmarkList() {
    const {
        issues,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        isPending,
        isError,
        errorMessage,
        refetch,
    } = useBookmarkList()

    const { optimisticIssues, pendingBookmarkKeys, toggleBookmark } = useIssueBookmarks({
        sourceIssues: issues,
        isSourceIssuesReady: !isPending && !isError,
        removeOnUnbookmark: true,
        onMutationSuccessAction: refetch,
    })

    const [query, setQuery] = useState('')
    const filteredItems = useSearchFilter(optimisticIssues, query)
    const displayItems = hasNextPage && filteredItems.length % 2 !== 0
        ? filteredItems.slice(0, -1)
        : filteredItems

    // sentinel 요소가 뷰포트에 진입하면 다음 페이지 요청 — 중복 요청 방지를 위해 isFetchingNextPage 체크
    const sentinelRef = useScrollSentinel(
        useCallback(() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }, [hasNextPage, isFetchingNextPage, fetchNextPage]),
    )

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <SearchBar
                    value={query}
                    onChange={setQuery}
                    resultCount={query ? filteredItems.length : undefined}
                    className="flex-1"
                />
                <BookmarkHelpDialog />
            </div>

            <SearchDataListState
                query={query}
                entityLabel="북마크"
                fallback={{
                    title: '저장한 북마크가 없습니다',
                    description: '대시보드에서 관심 있는 이슈를 저장하면 여기에서 북마크 목록을 확인할 수 있습니다.',
                    detail: '추천 이슈 페이지에서 관심 있는 이슈를 북마크로 추가해 보세요.',
                    action: <Link href="/dashboard">추천 이슈 보러가기</Link>,
                }}
                isPending={isPending}
                isError={isError}
                items={displayItems}
                errorMessage={errorMessage}
                onRetry={refetch}
                skeletonCount={10}
                renderContent={() => (
                    <BookmarkListContent
                        issues={displayItems}
                        pendingBookmarkKeys={pendingBookmarkKeys}
                        onToggleBookmark={toggleBookmark}
                    />
                )}
            />

            {hasNextPage && (
                <>
                    {isFetchingNextPage && <CardListSkeleton count={2} />}
                    <div ref={sentinelRef} className="h-10" />
                </>
            )}
        </div>
    )
}
