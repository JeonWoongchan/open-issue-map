'use client'

import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { CONTRIBUTION_TYPES, EXPERIENCE_LEVELS } from '@/constants/contribution-levels'
import { LANGUAGE_GROUP_PRESETS } from '@/constants/explore-presets'
import { SCORE_FILTER_THRESHOLDS, STAR_FILTER_THRESHOLDS } from '@/constants/scoring-rules'
import { EMPTY_ISSUE_FILTERS } from '@/types/issue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { CompetitionLevel, IssueFilters } from '@/types/issue'
import type { ContributionType } from '@/types/user'

type IssueSearchFilterProps = {
    // 언어 묶음은 GitHub 쿼리로 실려가는 값이라 IssueFilters가 아니라 IssueSearchState에 있다
    // (types/issue.ts 참고) — 이 팝오버는 UI상 한 필터 목록으로 같이 보여줄 뿐이다.
    languageGroup: string | null
    onLanguageGroupChangeAction: (languageGroup: string | null) => void
    filters: IssueFilters
    onChangeAction: (filters: IssueFilters) => void
}

const COMPETITION_LEVEL_OPTIONS: { value: CompetitionLevel; label: string }[] = [
    { value: 'OPEN', label: '오픈' },
    { value: 'ACTIVE', label: '진행중' },
    { value: 'HAS_PR', label: 'PR' },
]

// 배열 필터 토글 — 값이 있으면 제거, 없으면 추가
function toggleInArray<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

function FilterPill({
    label,
    selected,
    onClickAction,
}: {
    label: string
    selected: boolean
    onClickAction: () => void
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClickAction}
            className={cn(
                'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                selected
                    ? 'border-interactive-selected-border bg-interactive-selected text-interactive-selected-foreground'
                    : 'border-interactive-border bg-background text-interactive-action-hover hover:border-interactive-hover-border hover:bg-interactive-hover'
            )}
        >
            {label}
        </button>
    )
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
    const labelId = useId()

    return (
        <div role="group" aria-labelledby={labelId} className="flex min-w-0 items-start gap-2">
            <span id={labelId} className="w-14 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">{label}</span>
            <div className="flex flex-wrap gap-1.5">{children}</div>
        </div>
    )
}

// 이슈 탐색 페이지의 유일한 필터 팝오버 — 예전에 있던 "목록 필터"(이미 로드된 결과만 거르는
// 클라이언트 필터)는 없앴다. 여기서 바꾸는 값 중 언어 묶음은 검색 쿼리(language: qualifier)로,
// 나머지(난이도/진행상태/기여방식/최소스타/추천점수)는 GitHub이 지원하지 않아 응답을 받은 뒤
// 후처리로 거른다 — 하지만 사용자에게는 그 구분이 드러나지 않고, 무엇을 바꾸든 새로 검색된다.
export function IssueSearchFilter({
    languageGroup,
    onLanguageGroupChangeAction,
    filters,
    onChangeAction,
}: IssueSearchFilterProps) {
    const [open, setOpen] = useState(false)

    const toggle = <K extends keyof Omit<IssueFilters, 'contributionTypes' | 'competitionLevels'>>(key: K, value: IssueFilters[K]) => {
        onChangeAction({ ...filters, [key]: filters[key] === value ? null : value })
    }

    const toggleLanguageGroup = (key: string) =>
        onLanguageGroupChangeAction(languageGroup === key ? null : key)

    const toggleContributionType = (value: ContributionType) =>
        onChangeAction({ ...filters, contributionTypes: toggleInArray(filters.contributionTypes, value) })

    const toggleCompetitionLevel = (value: CompetitionLevel) =>
        onChangeAction({ ...filters, competitionLevels: toggleInArray(filters.competitionLevels, value) })

    const activeFilterCount =
        Number(languageGroup !== null) +
        Number(filters.difficultyLevel !== null) +
        filters.contributionTypes.length +
        filters.competitionLevels.length +
        Number(filters.minStars !== null) +
        Number(filters.minScore !== null)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors',
                        activeFilterCount > 0
                            ? 'border-interactive-selected-border bg-interactive-selected text-interactive-selected-foreground'
                            : 'border-interactive-border bg-background text-interactive-action-hover hover:border-interactive-hover-border hover:bg-interactive-hover'
                    )}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                    검색 필터
                    {activeFilterCount > 0 ? (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-interactive-action px-1 text-xs font-bold text-interactive-action-foreground">
                            {activeFilterCount}
                        </span>
                    ) : null}
                </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="max-h-[70vh] w-[calc(100vw-2rem)] max-w-80 overflow-y-auto">
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-interactive-action">검색 필터</span>
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                onChangeAction(EMPTY_ISSUE_FILTERS)
                                onLanguageGroupChangeAction(null)
                            }}
                            className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                        >
                            초기화
                        </button>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <FilterRow label="언어">
                        {LANGUAGE_GROUP_PRESETS.map((group) => (
                            <FilterPill
                                key={group.key}
                                label={group.label}
                                selected={languageGroup === group.key}
                                onClickAction={() => toggleLanguageGroup(group.key)}
                            />
                        ))}
                    </FilterRow>
                    <FilterRow label="난이도">
                        {EXPERIENCE_LEVELS.map((level) => (
                            <FilterPill
                                key={level.value}
                                label={level.label}
                                selected={filters.difficultyLevel === level.value}
                                onClickAction={() => toggle('difficultyLevel', level.value)}
                            />
                        ))}
                    </FilterRow>
                    <FilterRow label="기여 방식">
                        {CONTRIBUTION_TYPES.map((type) => (
                            <FilterPill
                                key={type.value}
                                label={type.label}
                                selected={filters.contributionTypes.includes(type.value)}
                                onClickAction={() => toggleContributionType(type.value)}
                            />
                        ))}
                    </FilterRow>
                    <FilterRow label="진행 상태">
                        {COMPETITION_LEVEL_OPTIONS.map((option) => (
                            <FilterPill
                                key={option.value}
                                label={option.label}
                                selected={filters.competitionLevels.includes(option.value)}
                                onClickAction={() => toggleCompetitionLevel(option.value)}
                            />
                        ))}
                    </FilterRow>
                    <FilterRow label="스타 수">
                        {STAR_FILTER_THRESHOLDS.map((threshold) => (
                            <FilterPill
                                key={threshold}
                                label={`${threshold.toLocaleString()}+`}
                                selected={filters.minStars === threshold}
                                onClickAction={() => toggle('minStars', threshold)}
                            />
                        ))}
                    </FilterRow>
                    <FilterRow label="추천 점수">
                        {SCORE_FILTER_THRESHOLDS.map((threshold) => (
                            <FilterPill
                                key={threshold}
                                label={`${threshold}+`}
                                selected={filters.minScore === threshold}
                                onClickAction={() => toggle('minScore', threshold)}
                            />
                        ))}
                    </FilterRow>
                </div>
            </PopoverContent>
        </Popover>
    )
}
