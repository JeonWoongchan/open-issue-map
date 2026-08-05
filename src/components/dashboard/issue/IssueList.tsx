'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { SearchDataListState } from '@/components/shared/SearchDataListState'
import { InfiniteScrollTrigger } from '@/components/shared/InfiniteScrollTrigger'
import { EXPLORE_PRESETS, type ExplorePreset } from '@/constants/explore-presets'
import { GITHUB_RATE_LIMITED_MESSAGE } from '@/constants/github-error-messages'
import { useIssueListView } from '@/hooks/useIssueListView'
import { useResponsiveColumnCount } from '@/hooks/useResponsiveColumnCount'
import { useToast } from '@/hooks/use-toast'
import type { IssueFilters, IssueSearchState, IssueCardItem } from '@/types/issue'
import type { ContributionType } from '@/types/user'
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

// 프리셋 아이콘 중 contributionType을 쓰는 것들 — 프리셋을 고를 때는 이 중 하나만
// 남기고 서로 배타적으로 동작해야 하므로, 팝오버에서 별도로 고른 나머지 타입(feat/test/review)과
// 구분해서 다뤄야 한다.
const PRESET_CONTRIBUTION_TYPES: ContributionType[] = ['doc', 'bug']

// GitHub 레이트리밋은 "곧 회복되는 일시적 지연"이라, 다른 진짜 에러(danger)와 달리
// 경고색(warning) + 재시도를 유도하는 문구로 안내한다.
const RATE_LIMITED_DISPLAY_MESSAGE = 'GitHub API 요청이 많아 잠시 지연되고 있어요. 잠시 후 다시 시도해 주세요.'

// 현재 filters 상태와 일치하는 프리셋을 찾는다 — 프리셋 아이콘은 한 번에 하나만
// 활성화되도록 handleSelectPreset이 항상 나머지 프리셋 필드를 같이 초기화해주므로,
// 여러 개가 동시에 일치할 일은 없다.
function findActivePresetKey(filters: IssueFilters): string | null {
    const matched = EXPLORE_PRESETS.find((preset) => {
        if (preset.difficultyLevel) return filters.difficultyLevel === preset.difficultyLevel
        if (preset.contributionType) return filters.contributionTypes.includes(preset.contributionType)
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
        sameRowSkeletonCount,
        newRowSkeletonCount,
    } = useIssueListView(search, filters, columnCount)

    // 프리셋 활성 상태(아이콘 행 + 클릭 시 토글 판단)가 같은 값을 공유하므로 한 번만 계산한다.
    const activePresetKey = findActivePresetKey(filters)

    const isRateLimited = errorMessage === GITHUB_RATE_LIMITED_MESSAGE
    const displayErrorMessage = isRateLimited ? RATE_LIMITED_DISPLAY_MESSAGE : errorMessage
    const errorVariant = isRateLimited ? 'warning' : 'danger'

    // 게스트 북마크 클릭 시 토스트 안내 후 차단
    async function handleToggleBookmark(issue: IssueCardItem) {
        if (isGuest) {
            toast({ title: '로그인 후 이용 가능한 기능이에요.' })
            return
        }
        await toggleBookmark(issue)
    }

    // 프리셋 아이콘은 한 번에 하나만 선택되게 한다 — 새 프리셋을 고르면 이전에 프리셋으로
    // 설정된 값(난이도/프리셋 기여방식/스타 수)은 전부 초기화하고 새 프리셋 값만 남긴다.
    // 팝오버에서 별도로 고른 기여방식(test/review 등)은 프리셋과 무관하므로 건드리지 않는다.
    function handleSelectPreset(preset: ExplorePreset) {
        const isActive = activePresetKey === preset.key
        const resetFilters: IssueFilters = {
            ...filters,
            difficultyLevel: null,
            contributionTypes: filters.contributionTypes.filter((t) => !PRESET_CONTRIBUTION_TYPES.includes(t)),
            minStars: null,
        }

        if (isActive) {
            onFiltersChangeAction(resetFilters)
            return
        }

        onFiltersChangeAction({
            ...resetFilters,
            difficultyLevel: preset.difficultyLevel ?? null,
            contributionTypes: preset.contributionType
                ? [...resetFilters.contributionTypes, preset.contributionType]
                : resetFilters.contributionTypes,
            minStars: preset.minStars ?? null,
        })
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

            <div className="flex flex-wrap items-center gap-2">
                <IssueSearchForm
                    value={search.query}
                    onSubmitAction={(query) => onSearchChangeAction({ ...search, query })}
                    className="min-w-0 flex-1"
                />
                <IssueSortToggle value={search.sort} onChangeAction={(sort) => onSearchChangeAction({ ...search, sort })} />
                <IssueSearchFilter
                    search={search}
                    onSearchChangeAction={onSearchChangeAction}
                    filters={filters}
                    onChangeAction={onFiltersChangeAction}
                />
                {helpSlot}
            </div>

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
                errorMessage={displayErrorMessage}
                errorVariant={errorVariant}
                hasNextPage={effectiveHasNextPage}
                onRetry={refetch}
                skeletonCount={12}
                renderContent={() => (
                    <IssueListContent
                        issues={displayItems}
                        onToggleBookmark={handleToggleBookmark}
                        trailingSkeletonCount={isFetchingNextPage ? sameRowSkeletonCount : 0}
                    />
                )}
            />

            <InfiniteScrollTrigger
                hasNextPage={effectiveHasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                isError={isNextPageError}
                errorMessage={displayErrorMessage}
                errorVariant={errorVariant}
                onRetryAction={retryNextPageAction}
                sentinelRefAction={sentinelRef}
                skeletonCount={newRowSkeletonCount}
            />
        </div>
    )
}
