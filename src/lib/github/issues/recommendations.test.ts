import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { capIssuesPerRepo, fetchRecommendedIssues, refreshCandidatePool } from '@/lib/github/issues/recommendations'
import {
    RECOMMENDATION_DISPLAY_LIMIT,
    RECOMMENDATION_FALLBACK_PAGE_SIZE,
    RECOMMENDATION_MIN_POOL_SIZE,
    RECOMMENDATION_PAGE_SIZE,
    RECOMMENDATION_SCORE_THRESHOLD,
} from '@/constants/scoring-rules'
import { GitHubResourceLimitError, GitHubTimeoutError } from '@/lib/github/client'
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
    getCandidatePoolCount: vi.fn(),
    upsertCandidatePool: vi.fn(),
}))
vi.mock('@/lib/bookmarks', () => ({ listUserBookmarkKeys: vi.fn(() => Promise.resolve([])) }))

import { fetchCandidateIssues } from '@/lib/github/issues/search'
import { rankIssues } from '@/lib/github/issues/ranking'
import { getCandidatePoolCount, getCandidatePools, upsertCandidatePool } from './candidate-pool-store'

const mockFetch = vi.mocked(fetchCandidateIssues)
const mockRank = vi.mocked(rankIssues)
const mockGetPools = vi.mocked(getCandidatePools)
const mockGetPoolCount = vi.mocked(getCandidatePoolCount)
const mockUpsertPool = vi.mocked(upsertCandidatePool)

beforeEach(() => {
    mockGetPoolCount.mockResolvedValue(null)
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
})

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

function makeRawIssues(count: number, start = 0): RawIssue[] {
    return Array.from({ length: count }, (_, index) => ({
        number: start + index,
        url: `https://github.com/owner/repo/issues/${start + index}`,
        repository: { stargazerCount: 100 },
    }) as RawIssue)
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
            expect.any(Number),
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

    it('100개씩 성공하면 3페이지를 누적해 목표 300개를 저장한다', async () => {
        const pages = [0, 1, 2].map((page) => makeRawIssues(RECOMMENDATION_PAGE_SIZE, page * RECOMMENDATION_PAGE_SIZE))
        pages.forEach((issues, page) => {
            mockFetch.mockResolvedValueOnce(makePage(issues, true, `cursor-${page}`))
        })

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockFetch).toHaveBeenCalledTimes(3)
        // 각 호출은 직전 페이지가 돌려준 endCursor를 그대로 이어받아야 한다
        expect(mockFetch.mock.calls[0][2]).toBeNull()
        for (let i = 1; i < 3; i++) {
            expect(mockFetch.mock.calls[i][2]).toBe(`cursor-${i - 1}`)
        }
        expect(mockUpsertPool).toHaveBeenCalledWith('TypeScript', 'latest', pages.flat())
    })

    it('GitHub이 hasMoreOnGithub=false를 반환하면 목표 개수 전에 멈춘다', async () => {
        mockFetch
            .mockResolvedValueOnce(makePage([{ number: 1 } as RawIssue], true, 'cursor-0'))
            .mockResolvedValueOnce(makePage([{ number: 2 } as RawIssue], false, null))

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('100개 요청이 resource limit이면 같은 cursor에서 50개로 낮춰 최대 3페이지를 누적한다', async () => {
        mockFetch.mockRejectedValueOnce(new GitHubResourceLimitError())
        const fallbackPages = Array.from({ length: 3 }, (_, page) => (
            makeRawIssues(RECOMMENDATION_FALLBACK_PAGE_SIZE, page * RECOMMENDATION_FALLBACK_PAGE_SIZE)
        ))
        fallbackPages.forEach((issues, page) => {
            mockFetch.mockResolvedValueOnce(makePage(issues, true, `fallback-cursor-${page}`))
        })

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockFetch).toHaveBeenCalledTimes(4)
        expect(mockFetch.mock.calls.map((call) => call[3])).toEqual([
            RECOMMENDATION_PAGE_SIZE,
            ...Array(3).fill(RECOMMENDATION_FALLBACK_PAGE_SIZE),
        ])
        expect(mockFetch.mock.calls[0][2]).toBeNull()
        expect(mockFetch.mock.calls[1][2]).toBeNull()
        expect(mockUpsertPool).toHaveBeenCalledWith('TypeScript', 'latest', fallbackPages.flat())
    })

    it('중간 페이지에서 fallback해도 앞서 성공한 페이지를 버리지 않는다', async () => {
        const firstPage = makeRawIssues(100)
        const fallbackPage1 = makeRawIssues(50, 100)
        const fallbackPage2 = makeRawIssues(50, 150)
        mockFetch
            .mockResolvedValueOnce(makePage(firstPage, true, 'cursor-100'))
            .mockRejectedValueOnce(new GitHubResourceLimitError())
            .mockResolvedValueOnce(makePage(fallbackPage1, true, 'cursor-150'))
            .mockResolvedValueOnce(makePage(fallbackPage2, true, 'cursor-200'))

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockFetch.mock.calls.map((call) => call[3])).toEqual([100, 100, 50, 50])
        expect(mockFetch.mock.calls.map((call) => call[2])).toEqual([
            null,
            'cursor-100',
            'cursor-100',
            'cursor-150',
        ])
        expect(mockUpsertPool).toHaveBeenCalledWith(
            'TypeScript',
            'latest',
            [...firstPage, fallbackPage1, fallbackPage2].flat(),
        )
    })

    it('50개 fallback 중 제한이 다시 발생해도 최소 150개를 확보했으면 부분 풀을 저장한다', async () => {
        mockFetch.mockRejectedValueOnce(new GitHubResourceLimitError())
        for (let page = 0; page < 3; page++) {
            mockFetch.mockResolvedValueOnce(makePage(
                makeRawIssues(RECOMMENDATION_FALLBACK_PAGE_SIZE, page * RECOMMENDATION_FALLBACK_PAGE_SIZE),
                true,
                `cursor-${page}`,
            ))
        }
        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockFetch).toHaveBeenCalledTimes(4)
        expect(mockUpsertPool).toHaveBeenCalledWith(
            'TypeScript',
            'latest',
            expect.arrayContaining(makeRawIssues(RECOMMENDATION_MIN_POOL_SIZE)),
        )
    })

    it('50개 fallback이 최소 150개 전에 실패하면 기존 DB 풀을 보존한다', async () => {
        mockFetch
            .mockRejectedValueOnce(new GitHubResourceLimitError())
            .mockResolvedValueOnce(makePage(makeRawIssues(50), true, 'cursor-0'))
            .mockResolvedValueOnce(makePage(makeRawIssues(50, 50), true, 'cursor-1'))
            .mockRejectedValueOnce(new GitHubResourceLimitError())

        await expect(refreshCandidatePool('TypeScript', 'latest', 'token'))
            .rejects.toBeInstanceOf(GitHubResourceLimitError)
        expect(mockUpsertPool).not.toHaveBeenCalled()
    })

    it('최소 150개를 확보한 뒤 조회 시간이 초과되면 부분 풀을 저장한다', async () => {
        const firstPage = makeRawIssues(100)
        const secondPage = makeRawIssues(50, 100)
        mockFetch
            .mockResolvedValueOnce(makePage(firstPage, true, 'cursor-100'))
            .mockResolvedValueOnce(makePage(secondPage, true, 'cursor-150'))
            .mockRejectedValueOnce(new GitHubTimeoutError())

        await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(mockUpsertPool).toHaveBeenCalledWith('TypeScript', 'latest', [...firstPage, ...secondPage])
    })

    it('빈 결과는 기존 후보 풀을 덮어쓰지 않는다', async () => {
        mockGetPoolCount.mockResolvedValueOnce(220)
        mockFetch.mockResolvedValueOnce(makePage([], false, null))

        const result = await refreshCandidatePool('TypeScript', 'latest', 'token')

        expect(result).toMatchObject({
            refreshStatus: 'preserved',
            preservationReason: 'empty_result',
            storedCount: 220,
        })
        expect(mockUpsertPool).not.toHaveBeenCalled()
    })

    it('popular degraded 결과가 후처리 기준 50개 미만이면 기존 후보 풀을 보존한다', async () => {
        mockGetPoolCount.mockResolvedValueOnce(180)
        mockFetch.mockRejectedValueOnce(new GitHubResourceLimitError())
        for (let page = 0; page < 3; page++) {
            const issues = makeRawIssues(50, page * 50).map((issue, index) => ({
                ...issue,
                repository: { stargazerCount: index < 10 ? 30 : 1 },
            })) as RawIssue[]
            mockFetch.mockResolvedValueOnce(makePage(issues, true, `cursor-${page}`))
        }

        const result = await refreshCandidatePool('TypeScript', 'popular', 'token')

        expect(result).toMatchObject({
            refreshStatus: 'preserved',
            preservationReason: 'below_condition_minimum',
            candidateCount: 30,
            storedCount: 180,
        })
        expect(mockUpsertPool).not.toHaveBeenCalled()
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
