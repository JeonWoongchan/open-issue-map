'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { SearchDataListState } from '@/components/shared/SearchDataListState'
import { InfiniteScrollTrigger } from '@/components/shared/InfiniteScrollTrigger'
import { EXPLORE_PRESETS, type ExplorePreset } from '@/constants/explore-presets'
import { useIssueListView } from '@/hooks/useIssueListView'
import { useResponsiveColumnCount } from '@/hooks/useResponsiveColumnCount'
import { useToast } from '@/hooks/use-toast'
import type { IssueFilters, IssueSearchState, IssueCardItem } from '@/types/issue'
import { IssueListContent } from './IssueListContent'
import { IssueSearchFilter } from './IssueSearchFilter'
import { IssueSearchForm } from './IssueSearchForm'
import { IssueSearchPresets } from './IssueSearchPresets'
import { IssueSortToggle } from './IssueSortToggle'
import { type ReactNode } from 'react'

type IssueListProps = {
    // 서버 컴포넌트에서 auth()로 확인한 게스트 여부 — useSession() 클라이언트 캐시 의존을 피함
    isGuest: boolean
    // 정적 탭 content를 클라이언트 번들에서 제외하기 위해 Server Component에서 주입
    helpSlot: ReactNode
    // 검색창·프리셋·정렬과 필터 팝오버가 같은 상태를 공유하기 위해 부모(IssueExploreWorkspace)가 소유·전달한다
    search: IssueSearchState
    onSearchChangeAction: (search: IssueSearchState) => void
    filters: IssueFilters
    onFiltersChangeAction: (filters: IssueFilters) => void
}

// 현재 search/filters 상태와 정확히 일치하는 프리셋을 찾는다
function findActivePresetKey(search: IssueSearchState, filters: IssueFilters): string | null {
    const matched = EXPLORE_PRESETS.find((preset) => {
        if (preset.githubLabel) return search.githubLabel === preset.githubLabel
        if (preset.minStars) return filters.minStars === preset.minStars
        return false
    })
    return matched?.key ?? null
}

export function IssueList({
    isGuest,
    helpSlot,
    search,
    onSearchChangeAction,
    filters,
    onFiltersChangeAction,
}: IssueListProps) {
    const { toast } = useToast()
    const columnCount = useResponsiveColumnCount()

    const {
        items,
        isPending,
        isError,
        errorMessage,
        refetch,
        displayItems,
        toggleBookmark,
        effectiveHasNextPage,
        isFetchingNextPage,
        isNextPageError,
        retryNextPageAction,
        sentinelRef,
    } = useIssueListView(search, filters, columnCount)

    // 프리셋 활성 상태(아이콘 행 + 클릭 시 토글 판단)가 같은 값을 공유하므로 한 번만 계산한다.
    const activePresetKey = findActivePresetKey(search, filters)

    // 게스트 북마크 클릭 시 토스트 안내 후 차단
    async function handleToggleBookmark(issue: IssueCardItem) {
        if (isGuest) {
            toast({ title: '로그인 후 이용 가능한 기능이에요.' })
            return
        }
        await toggleBookmark(issue)
    }

    function handleSelectPreset(preset: ExplorePreset) {
        const isActive = activePresetKey === preset.key
        if (preset.githubLabel) {
            onSearchChangeAction({ ...search, githubLabel: isActive ? null : preset.githubLabel })
        }
        if (preset.minStars) {
            onFiltersChangeAction({ ...filters, minStars: isActive ? null : preset.minStars })
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {isGuest && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    <span>지금은 기본 추천 이슈를 보여드리고 있어요.</span>
                    <button
                        type="button"
                        onClick={() => void signIn('github', { callbackUrl: '/issues' })}
                        className="font-medium text-interactive-action underline-offset-4 hover:underline"
                    >
                        로그인하고 나에게 맞는 이슈를 추천받아보세요.
                    </button>
                </div>
            )}

            <IssueSearchPresets activeKey={activePresetKey} onSelectAction={handleSelectPreset} />

            <div id="tour-search" className="flex flex-wrap items-center gap-2">
                <IssueSearchForm
                    value={search.query}
                    onSubmitAction={(query) => onSearchChangeAction({ ...search, query })}
                    className="min-w-0 flex-1"
                />
                <IssueSortToggle value={search.sort} onChangeAction={(sort) => onSearchChangeAction({ ...search, sort })} />
                <div id="tour-filter">
                    <IssueSearchFilter
                        search={search}
                        onSearchChangeAction={onSearchChangeAction}
                        filters={filters}
                        onChangeAction={onFiltersChangeAction}
                    />
                </div>
                {helpSlot}
            </div>

            <div id="tour-issue-list">
            <SearchDataListState
                query={search.query}
                entityLabel="이슈"
                fallback={{
                    title: '추천할 이슈가 없습니다',
                    description: '온보딩 설정이나 GitHub 조회 결과에 따라 지금은 보여드릴 추천 이슈가 없습니다.',
                    detail: '온보딩 설정을 다시 확인하거나 잠시 후 다시 시도해 주세요.',
                    action: isGuest
                        ? <button type="button" onClick={() => void signIn('github', { callbackUrl: '/issues' })}>로그인하여 맞춤 추천 받기</button>
                        : <Link href="/onboarding">온보딩 다시하기</Link>,
                }}
                isPending={isPending}
                isError={isError}
                items={items}
                errorMessage={errorMessage}
                onRetry={refetch}
                skeletonCount={12}
                renderContent={() => (
                    <IssueListContent
                        issues={displayItems}
                        onToggleBookmark={handleToggleBookmark}
                    />
                )}
            />
            </div>

            <InfiniteScrollTrigger
                hasNextPage={effectiveHasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                isError={isNextPageError}
                errorMessage={errorMessage}
                onRetryAction={retryNextPageAction}
                sentinelRefAction={sentinelRef}
                columnCount={columnCount}
            />
        </div>
    )
}
