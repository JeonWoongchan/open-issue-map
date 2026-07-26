import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchRecommendedIssues } from '@/lib/github/issues/recommendations'
import { RECOMMENDATION_FETCH_SIZE, RECOMMENDATION_SCORE_THRESHOLD } from '@/constants/scoring-rules'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { RawIssue, ScoredIssue } from '@/types/issue'

vi.mock('@/lib/github/issues/search', () => ({ fetchCandidateIssues: vi.fn() }))
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

const rawIssues = [{ number: 1 } as RawIssue]
const scoredIssues = [{ number: 1, score: 80 } as ScoredIssue]

describe('fetchRecommendedIssues', () => {
    it('조건별 sort qualifier로 RECOMMENDATION_FETCH_SIZE만큼 조회한다', async () => {
        mockFetch.mockResolvedValueOnce({ issues: rawIssues, endCursor: null, hasMoreOnGithub: false })
        mockRank.mockReturnValueOnce(scoredIssues)

        await fetchRecommendedIssues('latest', profile, 'token')

        expect(mockFetch).toHaveBeenCalledWith(profile.topLanguages, 'token', null, RECOMMENDATION_FETCH_SIZE, 'created-desc')
    })

    it('popular 조건은 reactions-desc로 조회한다', async () => {
        mockFetch.mockResolvedValueOnce({ issues: [], endCursor: null, hasMoreOnGithub: false })
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('popular', profile, 'token')

        expect(mockFetch).toHaveBeenCalledWith(profile.topLanguages, 'token', null, RECOMMENDATION_FETCH_SIZE, 'reactions-desc')
    })

    it('discussed 조건은 comments-desc로 조회한다', async () => {
        mockFetch.mockResolvedValueOnce({ issues: [], endCursor: null, hasMoreOnGithub: false })
        mockRank.mockReturnValueOnce([])

        await fetchRecommendedIssues('discussed', profile, 'token')

        expect(mockFetch).toHaveBeenCalledWith(profile.topLanguages, 'token', null, RECOMMENDATION_FETCH_SIZE, 'comments-desc')
    })

    it('RECOMMENDATION_SCORE_THRESHOLD를 임계값으로 채점한다', async () => {
        mockFetch.mockResolvedValueOnce({ issues: rawIssues, endCursor: null, hasMoreOnGithub: false })
        mockRank.mockReturnValueOnce(scoredIssues)

        const result = await fetchRecommendedIssues('latest', profile, 'token')

        expect(mockRank).toHaveBeenCalledWith(rawIssues, profile, RECOMMENDATION_SCORE_THRESHOLD)
        expect(result).toBe(scoredIssues)
    })
})
