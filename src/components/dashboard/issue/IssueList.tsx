'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { SearchBar } from '@/components/shared/SearchBar'
import { SearchDataListState } from '@/components/shared/SearchDataListState'
import { CardListSkeleton } from '@/components/shared/CardListSkeleton'
import { DashboardHelpDialog } from '@/components/dashboard/dashboard-help/DashboardHelpDialog'
import { useIssueBookmarks } from '@/hooks/useIssueBookmarks'
import { useIssueList } from '@/hooks/useIssueList'
import { useSearchFilter } from '@/hooks/useSearchFilter'
import { useScrollSentinel } from '@/hooks/useScrollSentinel'
import { IssueListContent } from './IssueListContent'

export function IssueList() {
    const {
        issues,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        isPending,
        isError,
        errorMessage,
        refetch,
        partial,
        failedCount,
    } = useIssueList()

    const { optimisticIssues, pendingBookmarkKeys, toggleBookmark } = useIssueBookmarks({
        sourceIssues: issues,
        isSourceIssuesReady: !isPending && !isError,
    })

    const [query, setQuery] = useState('')
    const filteredItems = useSearchFilter(optimisticIssues, query)
    // 다음 페이지가 있을 때 홀수 개면 마지막 1개를 숨겨 그리드를 짝수로 유지
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
                <DashboardHelpDialog />
            </div>

            <SearchDataListState
                query={query}
                entityLabel="이슈"
                fallback={{
                    title: '추천할 이슈가 없습니다',
                    description: '프로필 설정이나 GitHub 조회 결과에 따라 지금은 보여드릴 추천 이슈가 없습니다.',
                    detail: '온보딩 설정을 다시 확인하거나 잠시 후 다시 시도해 주세요.',
                    action: <Link href="/onboarding">온보딩 다시하기</Link>,
                }}
                isPending={isPending}
                isError={isError}
                items={displayItems}
                errorMessage={errorMessage}
                onRetry={refetch}
                skeletonCount={10}
                renderContent={() => (
                    <IssueListContent
                        issues={displayItems}
                        partial={partial}
                        failedCount={failedCount}
                        onToggleBookmark={toggleBookmark}
                        pendingBookmarkKeys={pendingBookmarkKeys}
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
