import { z } from 'zod'
import { SCORE_FILTER_THRESHOLDS } from '@/constants/scoring-rules'
import type { ScoreThreshold } from '@/constants/scoring-rules'
import type { ContributionType } from '@/types/user'
import type { IssueFilters, ScoredIssue } from '@/types/issue'

// URL 쿼리 파라미터는 임의 문자열 — 허용 목록 외 값은 null로 폴백
const difficultyLevelSchema = z.enum(['beginner', 'junior', 'mid', 'senior']).nullable().catch(null)
// Set.has()는 number → ScoreThreshold 좁히기를 지원하지 않아 타입 단언이 최소 필요
const validScoreSet = new Set<number>(SCORE_FILTER_THRESHOLDS)
// Zod v4는 NaN을 invalid_type으로 취급해 'abc' 같은 비숫자 입력 시 예외를 던진다.
// .catch(0)으로 폴백 — 0은 SCORE_FILTER_THRESHOLDS에 없으므로 transform에서 null이 된다.
const minScoreSchema = z.coerce.number().catch(0).transform(
    (n): ScoreThreshold | null => validScoreSet.has(n) ? (n as ScoreThreshold) : null
)

// 기여 방식 허용 목록 — 목록 외 값은 파싱 시 제거된다.
const VALID_CONTRIBUTION_TYPES = new Set<string>(['doc', 'bug', 'feat', 'test', 'review'])

export function parseIssueFilters(searchParams: URLSearchParams): IssueFilters {
    const contributionTypes = searchParams
        .getAll('contributionTypes')
        .filter((v): v is ContributionType => VALID_CONTRIBUTION_TYPES.has(v))

    return {
        language: searchParams.get('language'),
        difficultyLevel: difficultyLevelSchema.parse(searchParams.get('difficultyLevel')),
        contributionTypes,
        minScore: minScoreSchema.parse(searchParams.get('minScore')),
    }
}

export function applyFilters(issues: ScoredIssue[], filters: IssueFilters): ScoredIssue[] {
    return issues.filter((issue) => {
        if (filters.language && issue.language !== filters.language) return false
        if (filters.difficultyLevel && issue.difficultyLevel !== filters.difficultyLevel) return false
        // 기여 방식은 복수 선택 — 선택된 타입 중 하나라도 일치하면 통과, contributionType이 null인 이슈는 제외
        if (filters.contributionTypes.length > 0 &&
            (!issue.contributionType || !filters.contributionTypes.includes(issue.contributionType))) return false
        return !(filters.minScore !== null && issue.score < filters.minScore)
    })
}
