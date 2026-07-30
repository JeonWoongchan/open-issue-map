import { describe, it, expect, vi, afterEach } from 'vitest'
import { capIssuesPerRepo, fetchRecommendedIssues, refreshCandidatePool } from '@/lib/github/issues/recommendations'
import {
    RECOMMENDATION_DISPLAY_LIMIT,
    RECOMMENDATION_PAGE_COUNT,
    RECOMMENDATION_PAGE_SIZE,
    RECOMMENDATION_SCORE_THRESHOLD,
} from '@/constants/scoring-rules'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { IssueSearchResult } from '@/lib/github/issues/search'
import type { RawIssue, ScoredIssue } from '@/types/issue'

vi.mock('@/lib/github/issues/search', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/github/issues/search')>()
    return {
        ...actual,
        fetchCandidateIssues: vi.fn(),
        // 실제 dedupe 로직은 search.test.ts에서 별도로 검증 — 여기선 통과만 시킨다
        dedupeIssues: vi.fn((issues: RawIssue[]) => issues),
        // buildRecentWindowQualifier는 실제 구현(actual) 그대로 둔다 — 이 파일의 날짜 포맷 검증이 이걸 확인한다
    }
})
vi.mock('@/lib/github/issues/ranking', () => ({ rankIssues: vi.fn() }))
vi.mock('./candidate-pool-store', () => ({
    getCandidatePools: vi.fn(),
    upsertCandidatePool: vi.fn(),
}))
vi.mock('@/lib/bookmarks', () => ({ listUserBookmarkKeys: vi.fn(() => Promise.resolve([])) }))

import { fetchCandidateIssues } from '@/lib/github/issues/search'
import { rankIssues } from '@/lib/github/issues/ranking'
import { getCandidatePools, upsertCandidatePool } from './candidate-pool-store'

const mockFetch = vi.mocked(fetchCandidateIssues)
const mockRank = vi.mocked(rankIssues)
const mockGetPools = vi.mocked(getCandidatePools)
const mockUpsertPool = vi.mocked(upsertCandidatePool)

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

describe('refreshCandidatePool', () => {
    it('latest 조건은 created-desc로, 별도 qualifier 없이 언어 하나만 조회한다(시간 창 제한도 없음)', async () => {
        mockFetch.mockResolvedValueOnce(makePage(rawIssues, false, null))

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockFetch).toHaveBeenCalledWith(
            ['TypeScript'],
            'token',
            null,
            RECOMMENDATION_PAGE_SIZE,
            'created-desc',
            '',
        )
    })

    it('popular 조건은 reactions-desc + 최근 90일 created 창으로 조회한다(스타 수는 쿼리가 아니라 후처리로 거른다)', async () => {
        mockFetch.mockResolvedValueOnce(makePage([], false, null))

        await refreshCandidatePool('TypeScript', 'popular', 'token')

        const [, , , , sort, extraQualifiers] = mockFetch.mock.calls[0]
        expect(sort).toBe('reactions-desc')
        expect(extraQualifiers).toMatch(/^created:>=\d{4}-\d{2}-\d{2}$/)
    })

    it('popular 조건은 저장하기 전에 스타 30 미만 저장소의 이슈를 후처리로 제외한다', async () => {
        const lowStar = { number: 1, repository: { stargazerCount: 1 } } as RawIssue
        const highStar = { number: 2, repository: { stargazerCount: 30 } } as RawIssue
        mockFetch.mockResolvedValueOnce(makePage([lowStar, highStar], false, null))

        await refreshCandidatePool('TypeScript', 'popular', 'token')

        expect(mockUpsertPool).toHaveBeenCalledWith('TypeScript', 'popular', [highStar])
    })

    it('latest 조건은 스타 수와 무관하게 후처리 없이 그대로 저장한다', async () => {
        const lowStar = { number: 1, repository: { stargazerCount: 0 } } as RawIssue
        mockFetch.mockResolvedValueOnce(makePage([lowStar], false, null))

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockUpsertPool).toHaveBeenCalledWith('TypeScript', 'latest', [lowStar])
    })

    it('hasMoreOnGithub가 true인 동안 최대 RECOMMENDATION_PAGE_COUNT번까지 커서를 이어가며 페이지를 조회한다', async () => {
        for (let i = 0; i < RECOMMENDATION_PAGE_COUNT; i++) {
            mockFetch.mockResolvedValueOnce(makePage([{ number: i } as RawIssue], true, `cursor-${i}`))
        }

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockFetch).toHaveBeenCalledTimes(RECOMMENDATION_PAGE_COUNT)
        // 각 호출은 직전 페이지가 돌려준 endCursor를 그대로 이어받아야 한다
        expect(mockFetch.mock.calls[0][2]).toBeNull()
        for (let i = 1; i < RECOMMENDATION_PAGE_COUNT; i++) {
            expect(mockFetch.mock.calls[i][2]).toBe(`cursor-${i - 1}`)
        }
        // 저장 단계에는 모든 페이지의 이슈가 합쳐져 전달돼야 한다
        expect(mockUpsertPool).toHaveBeenCalledWith(
            'TypeScript',
            'latest',
            Array.from({ length: RECOMMENDATION_PAGE_COUNT }, (_, i) => ({ number: i })),
        )
    })

    it('GitHub이 hasMoreOnGithub=false를 반환하면 PAGE_COUNT 전에 멈춘다', async () => {
        mockFetch
            .mockResolvedValueOnce(makePage([{ number: 1 } as RawIssue], true, 'cursor-0'))
            .mockResolvedValueOnce(makePage([{ number: 2 } as RawIssue], false, null))

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockFetch).toHaveBeenCalledTimes(2)
    })
})

describe('fetchRecommendedIssues', () => {
    it('GitHub를 직접 부르지 않고, 프로필의 언어들을 한 번의 쿼리로 DB 후보 풀에서 읽는다', async () => {
        mockGetPools.mockResolvedValue([])
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('popular', { ...profile, topLanguages: ['TypeScript', 'Python'] })

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockGetPools).toHaveBeenCalledWith(['TypeScript', 'Python'], 'popular')
    })

    it('언어별 후보 풀을 하나로 합쳐서 채점으로 넘긴다', async () => {
        const tsIssue = { number: 1 } as RawIssue
        const pyIssue = { number: 2 } as RawIssue
        mockGetPools.mockResolvedValueOnce([[tsIssue], [pyIssue]])
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('latest', { ...profile, topLanguages: ['TypeScript', 'Python'] })

        expect(mockRank).toHaveBeenCalledWith([tsIssue, pyIssue], expect.anything(), RECOMMENDATION_SCORE_THRESHOLD)
    })

    it('저장된 풀이 없으면(빈 배열) 빈 배열로 취급한다', async () => {
        mockGetPools.mockResolvedValueOnce([])
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('latest', profile)

        expect(mockRank).toHaveBeenCalledWith([], profile, RECOMMENDATION_SCORE_THRESHOLD)
    })

    it('RECOMMENDATION_SCORE_THRESHOLD를 임계값으로 채점한다', async () => {
        mockGetPools.mockResolvedValueOnce([rawIssues])
        mockRank.mockReturnValueOnce(scoredIssues)

        const result = await fetchRecommendedIssues('latest', profile)

        expect(mockRank).toHaveBeenCalledWith(rawIssues, profile, RECOMMENDATION_SCORE_THRESHOLD)
        expect(result).toEqual(scoredIssues)
    })

    it('저장소당 캡을 통과한 후보가 RECOMMENDATION_DISPLAY_LIMIT보다 많으면 무작위로 그 개수만큼만 남긴다', async () => {
        // 저장소를 전부 다르게 둬서 capIssuesPerRepo(저장소당 캡)에는 안 걸리고
        // 이 단계(전체 개수 제한)만 단독으로 검증한다.
        const manyIssues = Array.from(
            { length: RECOMMENDATION_DISPLAY_LIMIT + 5 },
            (_, i) => ({ number: i, repoFullName: `owner/repo-${i}`, score: 80 }) as ScoredIssue,
        )
        mockGetPools.mockResolvedValueOnce([rawIssues])
        mockRank.mockReturnValueOnce(manyIssues)

        const result = await fetchRecommendedIssues('latest', profile)

        expect(result).toHaveLength(RECOMMENDATION_DISPLAY_LIMIT)
        result.forEach((issue) => expect(manyIssues).toContainEqual(issue))
    })

    it('후보가 RECOMMENDATION_DISPLAY_LIMIT 이하면 전부 반환한다', async () => {
        const fewIssues = Array.from(
            { length: 3 },
            (_, i) => ({ number: i, repoFullName: `owner/repo-${i}`, score: 80 }) as ScoredIssue,
        )
        mockGetPools.mockResolvedValueOnce([rawIssues])
        mockRank.mockReturnValueOnce(fewIssues)

        const result = await fetchRecommendedIssues('latest', profile)

        expect(result).toHaveLength(3)
        expect(result).toEqual(expect.arrayContaining(fewIssues))
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
