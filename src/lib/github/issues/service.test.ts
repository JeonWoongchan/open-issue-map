import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchIssueExplorePage } from '@/lib/github/issues/service'
import { GitHubRateLimitError, GitHubUnauthorizedError } from '@/lib/github/client'
import { EMPTY_ISSUE_FILTERS } from '@/types/issue'
import { EXPLORE_INITIAL_BATCH } from '@/constants/scoring-rules'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { RawIssue, ScoredIssue } from '@/types/issue'
import type { IssueSearchResult } from '@/lib/github/issues/search'

vi.mock('next/cache', () => ({ unstable_cache: vi.fn(<T>(fn: () => T) => fn) }))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('@/lib/github/issues/search', () => ({
  buildExploreQuery: vi.fn(() => 'is:open is:issue label:"help wanted" sort:updated-desc'),
  fetchExploreIssues: vi.fn(),
}))
vi.mock('@/lib/github/issues/ranking', () => ({ rankIssues: vi.fn() }))
vi.mock('@/lib/github/issues/filters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github/issues/filters')>()
  return { ...actual, applyFilters: vi.fn() }
})
vi.mock('@/lib/bookmarks', () => ({ listUserBookmarkKeys: vi.fn() }))

import { fetchExploreIssues } from '@/lib/github/issues/search'
import { rankIssues } from '@/lib/github/issues/ranking'
import { applyFilters } from '@/lib/github/issues/filters'
import { listUserBookmarkKeys } from '@/lib/bookmarks'

const mockSearch = vi.mocked(fetchExploreIssues)
const mockRank = vi.mocked(rankIssues)
const mockFilter = vi.mocked(applyFilters)
const mockBookmarks = vi.mocked(listUserBookmarkKeys)

afterEach(() => vi.clearAllMocks())

const profile: OnboardingProfile = {
  topLanguages: ['TypeScript'],
  experienceLevel: 'mid',
  contributionTypes: ['bug'],
  weeklyHours: 5,
  purpose: 'growth',
}

const baseArgs = {
  userId: 'user-1',
  accessToken: 'token',
  profile,
  filters: EMPTY_ISSUE_FILTERS,
  query: '',
  sort: 'latest',
  githubLabel: null,
  languageGroup: null,
  offset: 0,
  batch: EXPLORE_INITIAL_BATCH,
} satisfies Parameters<typeof fetchIssueExplorePage>[0]

function makeSearchResult(overrides: Partial<IssueSearchResult> = {}): IssueSearchResult {
  return {
    issues: [],
    endCursor: null,
    hasMoreOnGithub: false,
    ...overrides,
  }
}

function makeRawIssue(overrides: Partial<RawIssue> = {}): RawIssue {
  return {
    number: 1,
    title: 'Test issue',
    url: 'https://github.com/owner/repo/issues/1',
    body: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    comments: { totalCount: 0 },
    reactions: { totalCount: 0 },
    labels: { nodes: [] },
    repository: {
      nameWithOwner: 'owner/repo',
      url: 'https://github.com/owner/repo',
      primaryLanguage: { name: 'TypeScript' },
      stargazerCount: 100,
      pushedAt: new Date().toISOString(),
    },
    timelineItems: { nodes: [] },
    ...overrides,
  }
}

function makeScoredIssue(overrides: Partial<ScoredIssue> = {}): ScoredIssue {
  return {
    number: 1,
    title: 'Test issue',
    url: 'https://github.com/owner/repo/issues/1',
    repoFullName: 'owner/repo',
    repoUrl: 'https://github.com/owner/repo',
    language: 'TypeScript',
    stargazerCount: 100,
    labels: [],
    commentCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    score: 50,
    difficultyLevel: null,
    contributionType: null,
    competitionLevel: 'OPEN',
    hasPR: false,
    repoActivityLevel: 'active',
    isBookmarked: false,
    ...overrides,
  }
}

function setupDeps(
  rawIssues: RawIssue[],
  scoredIssues: ScoredIssue[] = [],
  searchOverrides: Partial<IssueSearchResult> = {}
) {
  mockSearch.mockResolvedValue(makeSearchResult({ issues: rawIssues, ...searchOverrides }))
  mockBookmarks.mockResolvedValue([])
  mockRank.mockReturnValue(scoredIssues)
  mockFilter.mockImplementation((issues) => issues)
}

describe('fetchIssueExplorePage — 에러 반환', () => {
  it('GitHubRateLimitError가 throw되면 { error: rate_limited }를 반환한다', async () => {
    mockSearch.mockRejectedValue(new GitHubRateLimitError())
    mockBookmarks.mockResolvedValue([])

    const result = await fetchIssueExplorePage(baseArgs)

    expect(result).toEqual({ error: 'rate_limited' })
  })

  it('GitHubUnauthorizedError가 throw되면 { error: unauthorized }를 반환한다', async () => {
    mockSearch.mockRejectedValue(new GitHubUnauthorizedError())
    mockBookmarks.mockResolvedValue([])

    const result = await fetchIssueExplorePage(baseArgs)

    expect(result).toEqual({ error: 'unauthorized' })
  })

  it('그 외 에러가 throw되면 { error: fetch_failed }를 반환한다', async () => {
    mockSearch.mockRejectedValue(new Error('network error'))
    mockBookmarks.mockResolvedValue([])

    const result = await fetchIssueExplorePage(baseArgs)

    expect(result).toEqual({ error: 'fetch_failed' })
  })
})

describe('fetchIssueExplorePage — foreground 구간(offset < 30)', () => {
  it('offset=0이면 커서 없이(null) foreground 크기(30)로 요청한다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()], { hasMoreOnGithub: true, endCursor: 'cursor-next' })

    const result = await fetchIssueExplorePage(baseArgs)

    expect(mockSearch).toHaveBeenCalledWith(expect.any(String), 'token', null, 30)
    expect('error' in result).toBe(false)
    if ('error' in result) return
    // foreground 구간에서는 hasMoreOnGithub만 보고, background를 실제로 보기 전까지는
    // nextBatch를 확정하지 않는다(같은 배치 안에서 offset만 진행시킨다).
    expect(result.hasMore).toBe(true)
    expect(result.nextBatch).toBeNull()
    expect(result.batch).toBe(EXPLORE_INITIAL_BATCH)
  })

  it('GitHub에 더 없으면(hasMoreOnGithub=false) hasMore도 false다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()], { hasMoreOnGithub: false })

    const result = await fetchIssueExplorePage(baseArgs)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.hasMore).toBe(false)
    expect(result.nextBatch).toBeNull()
  })
})

describe('fetchIssueExplorePage — background 구간(offset >= 30)', () => {
  it('background 크기(90)로 같은 배치 커서를 요청한다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()], { hasMoreOnGithub: true, endCursor: 'cursor-next' })

    await fetchIssueExplorePage({ ...baseArgs, offset: 30, batch: 'cursor-prev' })

    expect(mockSearch).toHaveBeenCalledWith(expect.any(String), 'token', 'cursor-prev', 90)
  })

  it('배치의 raw 이슈를 다 썼고 GitHub에 더 있으면 nextBatch를 채운다', async () => {
    const raw = Array.from({ length: 90 }, (_, i) => makeRawIssue({ number: i + 1 }))
    const scored = raw.map((r) => makeScoredIssue({ number: r.number }))
    setupDeps(raw, scored, { hasMoreOnGithub: true, endCursor: 'cursor-next' })

    // offset=60: 60+30=90 >= rawCount(90) → 배치 소진
    const result = await fetchIssueExplorePage({ ...baseArgs, offset: 60, batch: 'cursor-prev' })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.hasMore).toBe(true)
    expect(result.nextBatch).toBe('cursor-next')
  })

  it('배치를 다 썼고 GitHub에도 더 없으면 hasMore=false, nextBatch=null이다', async () => {
    const raw = Array.from({ length: 90 }, (_, i) => makeRawIssue({ number: i + 1 }))
    const scored = raw.map((r) => makeScoredIssue({ number: r.number }))
    setupDeps(raw, scored, { hasMoreOnGithub: false, endCursor: null })

    const result = await fetchIssueExplorePage({ ...baseArgs, offset: 60, batch: 'cursor-prev' })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.hasMore).toBe(false)
    expect(result.nextBatch).toBeNull()
  })

  it('배치 안에 아직 raw 이슈가 남아있으면 같은 배치를 유지한다(nextBatch=null)', async () => {
    const raw = Array.from({ length: 90 }, (_, i) => makeRawIssue({ number: i + 1 }))
    const scored = raw.map((r) => makeScoredIssue({ number: r.number }))
    setupDeps(raw, scored, { hasMoreOnGithub: true, endCursor: 'cursor-next' })

    // offset=30: 30+30=60 < rawCount(90) → 배치 안에 아직 남아있음
    const result = await fetchIssueExplorePage({ ...baseArgs, offset: 30, batch: 'cursor-prev' })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.hasMore).toBe(true)
    expect(result.nextBatch).toBeNull()
    expect(result.batch).toBe('cursor-prev')
  })
})

describe('fetchIssueExplorePage — 북마크 병합', () => {
  it('북마크 키와 일치하는 이슈에 isBookmarked=true를 설정한다', async () => {
    const scored = [
      makeScoredIssue({ repoFullName: 'owner/repo', number: 1 }),
      makeScoredIssue({ repoFullName: 'owner/repo', number: 2 }),
    ]
    mockSearch.mockResolvedValue(makeSearchResult({ issues: [makeRawIssue()] }))
    mockBookmarks.mockResolvedValue(['owner/repo#1'])
    mockRank.mockReturnValue(scored)
    mockFilter.mockImplementation((issues) => issues)

    const result = await fetchIssueExplorePage(baseArgs)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.issues[0].isBookmarked).toBe(true)
    expect(result.issues[1].isBookmarked).toBe(false)
  })

  it('게스트(userId=null)는 북마크 조회를 생략한다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])

    await fetchIssueExplorePage({ ...baseArgs, userId: null })

    expect(mockBookmarks).not.toHaveBeenCalled()
  })
})

describe('fetchIssueExplorePage — 후처리 필터로 인한 언더필', () => {
  // 난이도/진행상태/기여방식/추천점수/최소스타는 GitHub 쿼리로 못 보내 여기서만 걸러진다.
  // 이 필터 때문에 이번 페이지가 적게(또는 0개) 나와도 hasMore/nextBatch는 raw fetch
  // 결과 기준으로만 판단한다 — 무한스크롤이 같은 조건의 다음 페이지를 자동으로 계속
  // 가져오게 하기 위함.
  it('필터로 결과가 다 걸러져도 hasMore는 raw 결과 기준(hasMoreOnGithub) 그대로다', async () => {
    const raw = [makeRawIssue({ number: 1 }), makeRawIssue({ number: 2 })]
    const scored = [makeScoredIssue({ number: 1 }), makeScoredIssue({ number: 2 })]
    mockSearch.mockResolvedValue(makeSearchResult({ issues: raw, hasMoreOnGithub: true, endCursor: 'c1' }))
    mockBookmarks.mockResolvedValue([])
    mockRank.mockReturnValue(scored)
    mockFilter.mockReturnValue([])  // 필터가 전부 걸러냄

    const result = await fetchIssueExplorePage({ ...baseArgs, filters: { ...EMPTY_ISSUE_FILTERS, minScore: 90 } })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.issues).toHaveLength(0)
    expect(result.hasMore).toBe(true)
  })
})

describe('fetchIssueExplorePage — 캐시 키', () => {
  it('캐시 키에 사용자 식별자를 포함하지 않는다(공개 GitHub 데이터라 공유 캐시)', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])
    const { unstable_cache } = await import('next/cache')

    await fetchIssueExplorePage(baseArgs)

    const cacheKey = vi.mocked(unstable_cache).mock.calls[0][1] as string[]
    expect(cacheKey).not.toContain('user-1')
  })

  it('캐시 키에 배치 커서가 포함된다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])
    const { unstable_cache } = await import('next/cache')

    await fetchIssueExplorePage({ ...baseArgs, offset: 30, batch: 'cursor-ts' })

    const cacheKey = vi.mocked(unstable_cache).mock.calls[0][1] as string[]
    expect(cacheKey).toContain('cursor-ts')
  })
})

describe('fetchIssueExplorePage — 점수 하한 없이 랭킹한다', () => {
  it('rankIssues를 MATCH_SCORE_MINIMUM(0)으로 호출해 온보딩 미매칭 이슈도 걸러내지 않는다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])

    await fetchIssueExplorePage(baseArgs)

    expect(mockRank).toHaveBeenCalledWith(expect.anything(), profile, 0)
  })
})

describe('fetchIssueExplorePage — 자유 텍스트 검색은 캐싱을 건너뛴다', () => {
  it('검색어가 없으면 unstable_cache로 감싼다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])
    const { unstable_cache } = await import('next/cache')

    await fetchIssueExplorePage(baseArgs)

    expect(vi.mocked(unstable_cache)).toHaveBeenCalled()
  })

  it('검색어가 있으면 unstable_cache를 전혀 호출하지 않는다(캐시 미스만 쌓이는 것을 피함)', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()], { hasMoreOnGithub: true, endCursor: 'cursor-next' })
    const { unstable_cache } = await import('next/cache')

    await fetchIssueExplorePage({ ...baseArgs, query: 'memory leak' })

    expect(vi.mocked(unstable_cache)).not.toHaveBeenCalled()
  })

  it('검색어가 있으면 offset=0이어도 background 선제 프리페치를 트리거하지 않는다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()], { hasMoreOnGithub: true, endCursor: 'cursor-next' })

    await fetchIssueExplorePage({ ...baseArgs, query: 'memory leak' })

    // foreground(라이브) 1회만 호출되고, background(90) 프리페치는 없어야 한다.
    expect(mockSearch).toHaveBeenCalledTimes(1)
    expect(mockSearch).toHaveBeenCalledWith(expect.any(String), 'token', null, 30)
  })

  it('검색어가 있어도 결과는 정상적으로 반환한다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()], { hasMoreOnGithub: false })

    const result = await fetchIssueExplorePage({ ...baseArgs, query: 'memory leak' })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.issues).toHaveLength(1)
  })
})

describe('fetchIssueExplorePage — background 동시 프리페치', () => {
  it('offset=0이면 foreground와 별개로 background(90) fetch도 트리거한다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()], { hasMoreOnGithub: true, endCursor: 'cursor-next' })

    await fetchIssueExplorePage(baseArgs)

    expect(mockSearch).toHaveBeenCalledWith(expect.any(String), 'token', null, 30)
    expect(mockSearch).toHaveBeenCalledWith(expect.any(String), 'token', null, 90)
  })

  it('offset>0이면 background만 요청하고 별도 프리페치를 추가로 트리거하지 않는다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()], { hasMoreOnGithub: true, endCursor: 'cursor-next' })

    await fetchIssueExplorePage({ ...baseArgs, offset: 30, batch: 'cursor-prev' })

    expect(mockSearch).toHaveBeenCalledTimes(1)
    expect(mockSearch).toHaveBeenCalledWith(expect.any(String), 'token', 'cursor-prev', 90)
  })
})
