import { describe, it, expect, vi, afterEach } from 'vitest'
import { capIssuesPerRepo, fetchRecommendedIssues } from '@/lib/github/issues/recommendations'
import {
    RECOMMENDATION_PAGE_COUNT,
    RECOMMENDATION_PAGE_SIZE,
    RECOMMENDATION_SCORE_THRESHOLD,
} from '@/constants/scoring-rules'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { IssueSearchResult } from '@/lib/github/issues/search'
import type { RawIssue, ScoredIssue } from '@/types/issue'

vi.mock('@/lib/github/issues/search', () => ({
    fetchCandidateIssues: vi.fn(),
    // 실제 dedupe 로직은 search.test.ts에서 별도로 검증 — 여기선 통과만 시킨다
    dedupeIssues: vi.fn((issues: RawIssue[]) => issues),
}))
vi.mock('@/lib/github/issues/ranking', () => ({ rankIssues: vi.fn() }))

import { fetchCandidateIssues } from '@/lib/github/issues/search'
import { rankIssues } from '@/lib/github/issues/ranking'

const mockFetch = vi.mocked(fetchCandidateIssues)
const mockRank = vi.mocked(rankIssues)

afterEach(() => vi.clearAllMocks())

const profile: OnboardingProfile = {
    topLanguages: ['TypeScript'],
    experienceLevel: 'mid',
    contributionTypes: ['bug'],
    weeklyHours: 10,
    purpose: 'growth',
}

function makePage(issues: RawIssue[], hasMoreOnGithub: boolean, endCursor: string | null): IssueSearchResult {
    return { issues, endCursor, hasMoreOnGithub }
}

const rawIssues = [{ number: 1 } as RawIssue]
const scoredIssues = [{ number: 1, score: 80 } as ScoredIssue]

describe('fetchRecommendedIssues', () => {
    it('latest 조건은 created-desc로, 별도 qualifier 없이 조회한다(시간 창 제한도 없음)', async () => {
        mockFetch.mockResolvedValueOnce(makePage(rawIssues, false, null))
        mockRank.mockReturnValueOnce(scoredIssues)

        await fetchRecommendedIssues('latest', profile, 'token')

        expect(mockFetch).toHaveBeenCalledWith(
            profile.topLanguages,
            'token',
            null,
            RECOMMENDATION_PAGE_SIZE,
            'created-desc',
            '',
        )
    })

    it('popular 조건은 reactions-desc + 최근 90일 created 창으로 조회한다(스타 수는 쿼리가 아니라 후처리로 거른다)', async () => {
        mockFetch.mockResolvedValueOnce(makePage([], false, null))
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('popular', profile, 'token')

        const [, , , , sort, extraQualifiers] = mockFetch.mock.calls[0]
        expect(sort).toBe('reactions-desc')
        expect(extraQualifiers).toMatch(/^created:>=\d{4}-\d{2}-\d{2}$/)
    })

    it('popular 조건은 채점 전에 스타 30 미만 저장소의 이슈를 후처리로 제외한다', async () => {
        const lowStar = { number: 1, repository: { stargazerCount: 1 } } as RawIssue
        const highStar = { number: 2, repository: { stargazerCount: 30 } } as RawIssue
        mockFetch.mockResolvedValueOnce(makePage([lowStar, highStar], false, null))
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('popular', profile, 'token')

        expect(mockRank).toHaveBeenCalledWith([highStar], profile, RECOMMENDATION_SCORE_THRESHOLD)
    })

    it('latest 조건은 스타 수와 무관하게 후처리 없이 그대로 채점으로 넘긴다', async () => {
        const lowStar = { number: 1, repository: { stargazerCount: 0 } } as RawIssue
        mockFetch.mockResolvedValueOnce(makePage([lowStar], false, null))
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('latest', profile, 'token')

        expect(mockRank).toHaveBeenCalledWith([lowStar], profile, RECOMMENDATION_SCORE_THRESHOLD)
    })

    it('hasMoreOnGithub가 true인 동안 최대 RECOMMENDATION_PAGE_COUNT번까지 커서를 이어가며 페이지를 조회한다', async () => {
        for (let i = 0; i < RECOMMENDATION_PAGE_COUNT; i++) {
            mockFetch.mockResolvedValueOnce(makePage([{ number: i } as RawIssue], true, `cursor-${i}`))
        }
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('latest', profile, 'token')

        expect(mockFetch).toHaveBeenCalledTimes(RECOMMENDATION_PAGE_COUNT)
        // 각 호출은 직전 페이지가 돌려준 endCursor를 그대로 이어받아야 한다
        expect(mockFetch.mock.calls[0][2]).toBeNull()
        for (let i = 1; i < RECOMMENDATION_PAGE_COUNT; i++) {
            expect(mockFetch.mock.calls[i][2]).toBe(`cursor-${i - 1}`)
        }
        // 채점 단계에는 모든 페이지의 이슈가 합쳐져 전달돼야 한다
        expect(mockRank).toHaveBeenCalledWith(
            Array.from({ length: RECOMMENDATION_PAGE_COUNT }, (_, i) => ({ number: i })),
            profile,
            RECOMMENDATION_SCORE_THRESHOLD,
        )
    })

    it('GitHub이 hasMoreOnGithub=false를 반환하면 PAGE_COUNT 전에 멈춘다', async () => {
        mockFetch
            .mockResolvedValueOnce(makePage([{ number: 1 } as RawIssue], true, 'cursor-0'))
            .mockResolvedValueOnce(makePage([{ number: 2 } as RawIssue], false, null))
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('latest', profile, 'token')

        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('RECOMMENDATION_SCORE_THRESHOLD를 임계값으로 채점한다', async () => {
        mockFetch.mockResolvedValueOnce(makePage(rawIssues, false, null))
        mockRank.mockReturnValueOnce(scoredIssues)

        const result = await fetchRecommendedIssues('latest', profile, 'token')

        expect(mockRank).toHaveBeenCalledWith(rawIssues, profile, RECOMMENDATION_SCORE_THRESHOLD)
        expect(result).toEqual(scoredIssues)
    })
})

function makeScoredIssue(overrides: Partial<ScoredIssue> = {}): ScoredIssue {
    return { number: 1, repoFullName: 'owner/repo', score: 80, ...overrides } as ScoredIssue
}

describe('capIssuesPerRepo', () => {
    afterEach(() => vi.restoreAllMocks())

    it('저장소당 후보가 cap 이하면 전부 유지한다', () => {
        const issues = [
            makeScoredIssue({ number: 1, repoFullName: 'a/a' }),
            makeScoredIssue({ number: 2, repoFullName: 'a/a' }),
        ]

        expect(capIssuesPerRepo(issues, 3)).toHaveLength(2)
    })

    it('저장소당 후보가 cap을 넘으면 cap 개수만 남긴다', () => {
        const issues = Array.from({ length: 5 }, (_, i) => makeScoredIssue({ number: i + 1, repoFullName: 'a/a' }))

        const result = capIssuesPerRepo(issues, 3)

        expect(result).toHaveLength(3)
        // 전부 원본 후보 중에서 골라야 한다
        result.forEach((issue) => expect(issues).toContainEqual(issue))
    })

    it('여러 저장소가 섞여 있으면 저장소별로 독립적으로 캡을 적용하고 원본 순서를 유지한다', () => {
        const issues = [
            makeScoredIssue({ number: 1, repoFullName: 'a/a' }),
            makeScoredIssue({ number: 2, repoFullName: 'b/b' }),
            makeScoredIssue({ number: 3, repoFullName: 'a/a' }),
            makeScoredIssue({ number: 4, repoFullName: 'b/b' }),
        ]

        const result = capIssuesPerRepo(issues, 3)

        expect(result).toHaveLength(4)
        expect(result.map((issue) => issue.number)).toEqual([1, 2, 3, 4])
    })

    it('Math.random 값이 다르면 같은 입력에서도 다른 조합이 뽑힐 수 있다', () => {
        const issues = Array.from({ length: 5 }, (_, i) => makeScoredIssue({ number: i + 1, repoFullName: 'a/a' }))

        const randomSpy = vi.spyOn(Math, 'random')
        randomSpy.mockReturnValue(0)
        const first = capIssuesPerRepo(issues, 3).map((issue) => issue.number)

        randomSpy.mockReturnValue(0.99)
        const second = capIssuesPerRepo(issues, 3).map((issue) => issue.number)

        expect(first).not.toEqual(second)
    })
})
