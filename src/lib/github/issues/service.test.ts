import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchIssueListPage } from '@/lib/github/issues/service'
import { INITIAL_BATCH } from '@/lib/github/batch'
import { GitHubRateLimitError, GitHubUnauthorizedError } from '@/lib/github/client'
import { FOREGROUND_FETCH_SIZE, PAGE_SIZE } from '@/constants/scoring-rules'
import { EMPTY_ISSUE_FILTERS } from '@/types/issue'
import type { OnboardingProfile } from '@/lib/user/profile'
import type { RawIssue, ScoredIssue } from '@/types/issue'
import type { IssueSearchResult } from '@/lib/github/issues/search'

vi.mock('next/cache', () => ({ unstable_cache: vi.fn(<T>(fn: () => T) => fn) }))
vi.mock('next/server', () => ({ after: vi.fn((fn: () => void) => fn()) }))
vi.mock('@/lib/github/issues/search', () => ({ fetchCandidateIssues: vi.fn() }))
vi.mock('@/lib/github/issues/ranking', () => ({ rankIssues: vi.fn() }))
vi.mock('@/lib/github/issues/filters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github/issues/filters')>()
  return { ...actual, applyFilters: vi.fn() }
})
vi.mock('@/lib/bookmarks', () => ({ listUserBookmarkKeys: vi.fn() }))

import { unstable_cache } from 'next/cache'
import { fetchCandidateIssues } from '@/lib/github/issues/search'
import { rankIssues } from '@/lib/github/issues/ranking'
import { applyFilters } from '@/lib/github/issues/filters'
import { listUserBookmarkKeys } from '@/lib/bookmarks'

const mockSearch = vi.mocked(fetchCandidateIssues)
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
  offset: 0,
  batchParam: INITIAL_BATCH,
} satisfies Parameters<typeof fetchIssueListPage>[0]

function makeSearchResult(overrides: Partial<IssueSearchResult> = {}): IssueSearchResult {
  return {
    issues: [],
    endCursor: null,
    hasMoreOnGithub: false,
    ...overrides,
  }
}

// service.ts의 searchResult.issues는 RawIssue — repository.nameWithOwner 필수
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

// rankIssues의 반환값은 ScoredIssue
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
  mockFilter.mockImplementation((issues) => issues)  // isBookmarked 설정 후의 rankedIssues를 그대로 통과
}

describe('fetchIssueListPage — 에러 반환', () => {
  it('GitHubRateLimitError가 throw되면 { error: rate_limited }를 반환한다', async () => {
    mockSearch.mockRejectedValue(new GitHubRateLimitError())
    mockBookmarks.mockResolvedValue([])

    const result = await fetchIssueListPage(baseArgs)

    expect(result).toEqual({ error: 'rate_limited' })
  })

  it('GitHubUnauthorizedError가 throw되면 { error: unauthorized }를 반환한다', async () => {
    mockSearch.mockRejectedValue(new GitHubUnauthorizedError())
    mockBookmarks.mockResolvedValue([])

    const result = await fetchIssueListPage(baseArgs)

    expect(result).toEqual({ error: 'unauthorized' })
  })

  it('그 외 에러가 throw되면 { error: fetch_failed }를 반환한다', async () => {
    mockSearch.mockRejectedValue(new Error('network error'))
    mockBookmarks.mockResolvedValue([])

    const result = await fetchIssueListPage(baseArgs)

    expect(result).toEqual({ error: 'fetch_failed' })
  })
})

describe('fetchIssueListPage - batch validation', () => {
  it('길이 제한을 넘는 batch는 GitHub 조회 없이 invalid_batch를 반환한다', async () => {
    const result = await fetchIssueListPage({ ...baseArgs, batchParam: 'a'.repeat(501) })

    expect(result).toEqual({ error: 'invalid_batch' })
    expect(mockSearch).not.toHaveBeenCalled()
    expect(mockBookmarks).not.toHaveBeenCalled()
  })

  it('일반 cursor 문자열은 그대로 GitHub after 파라미터로 전달된다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])

    const result = await fetchIssueListPage({ ...baseArgs, batchParam: 'cursor-ts' })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.batch).toBe('cursor-ts')
    expect(mockSearch).toHaveBeenCalledWith(['TypeScript'], 'token', 'cursor-ts', FOREGROUND_FETCH_SIZE)
  })
})

describe('fetchIssueListPage — foreground/background 분기', () => {
  it('offset이 FOREGROUND_FETCH_SIZE 미만이면 foreground 크기로 조회한다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])

    await fetchIssueListPage({ ...baseArgs, offset: 0 })

    expect(mockSearch).toHaveBeenCalledWith(['TypeScript'], 'token', null, FOREGROUND_FETCH_SIZE)
  })

  it('offset이 FOREGROUND_FETCH_SIZE 이상이면 background(전체) 크기로 조회한다', async () => {
    const scored = Array.from({ length: FOREGROUND_FETCH_SIZE + PAGE_SIZE }, (_, i) => makeScoredIssue({ number: i + 1 }))
    setupDeps([makeRawIssue()], scored)

    await fetchIssueListPage({ ...baseArgs, offset: FOREGROUND_FETCH_SIZE })

    expect(mockSearch).toHaveBeenCalledWith(['TypeScript'], 'token', null, 100)
  })

  it('offset=0 요청 시 background 캐시도 함께 트리거된다(after 콜백)', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])

    await fetchIssueListPage({ ...baseArgs, offset: 0 })

    // foreground(30) 호출 + after()로 트리거된 background(100) 호출, 총 2번
    expect(mockSearch).toHaveBeenCalledWith(['TypeScript'], 'token', null, FOREGROUND_FETCH_SIZE)
    expect(mockSearch).toHaveBeenCalledWith(['TypeScript'], 'token', null, 100)
  })

  it('offset>0이면 background 프리페치를 다시 트리거하지 않는다', async () => {
    const scored = Array.from({ length: FOREGROUND_FETCH_SIZE }, (_, i) => makeScoredIssue({ number: i + 1 }))
    setupDeps([makeRawIssue()], scored)

    await fetchIssueListPage({ ...baseArgs, offset: PAGE_SIZE })

    // foreground 크기 호출만 있고, background(100) 호출은 없어야 한다
    expect(mockSearch).toHaveBeenCalledTimes(1)
    expect(mockSearch).toHaveBeenCalledWith(['TypeScript'], 'token', null, FOREGROUND_FETCH_SIZE)
  })
})

describe('fetchIssueListPage — 페이지네이션', () => {
  it('이슈 수가 PAGE_SIZE 이하면 isLastPage이고 nextBatch=null이다', async () => {
    const scored = Array.from({ length: PAGE_SIZE - 1 }, (_, i) => makeScoredIssue({ number: i + 1 }))
    setupDeps([makeRawIssue()], scored)

    const result = await fetchIssueListPage(baseArgs)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.nextBatch).toBeNull()
    expect(result.hasMore).toBe(false)
    expect(result.canLoadMoreCandidates).toBe(false)
  })

  it('foreground 구간에서 GitHub에 더 있으면 total을 경계 너머로 보정해 같은 배치 안에서 계속 진행한다', async () => {
    // foreground(30개)는 raw fetch 크기가 작아 total이 실제보다 작게 나올 수 있다 — 이걸 그대로
    // 배치 종료 신호로 쓰면 background(100개) 구간에 도달하기도 전에 새 배치로 넘어가버린다.
    const scored = Array.from({ length: PAGE_SIZE }, (_, i) => makeScoredIssue({ number: i + 1 }))
    setupDeps([makeRawIssue()], scored, { hasMoreOnGithub: true, endCursor: 'cursor-abc' })

    const result = await fetchIssueListPage(baseArgs)  // offset: 0 (foreground 구간)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.total).toBeGreaterThan(FOREGROUND_FETCH_SIZE)
    expect(result.nextBatch).toBeNull()
    expect(result.hasMore).toBe(true)
  })

  it('background 구간(offset>=FOREGROUND_FETCH_SIZE)에서 진짜로 다 쓰면 nextBatch로 endCursor를 반환한다', async () => {
    const scored = Array.from({ length: FOREGROUND_FETCH_SIZE + PAGE_SIZE }, (_, i) => makeScoredIssue({ number: i + 1 }))
    setupDeps([makeRawIssue()], scored, { hasMoreOnGithub: true, endCursor: 'cursor-abc' })

    const result = await fetchIssueListPage({ ...baseArgs, offset: FOREGROUND_FETCH_SIZE })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.total).toBe(FOREGROUND_FETCH_SIZE + PAGE_SIZE)
    expect(result.nextBatch).toBe('cursor-abc')
    expect(result.hasMore).toBe(true)
    expect(result.canLoadMoreCandidates).toBe(false)
  })

  it('이슈가 PAGE_SIZE 초과면 nextBatch=null이고 hasMore=true이다', async () => {
    const scored = Array.from({ length: PAGE_SIZE + 5 }, (_, i) => makeScoredIssue({ number: i + 1 }))
    setupDeps([makeRawIssue()], scored)

    const result = await fetchIssueListPage(baseArgs)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.nextBatch).toBeNull()
    expect(result.hasMore).toBe(true)
    expect(result.canLoadMoreCandidates).toBe(false)
    expect(result.issues).toHaveLength(PAGE_SIZE)
  })

  it('offset이 적용되어 PAGE_SIZE 만큼 슬라이싱한다', async () => {
    const scored = Array.from({ length: 25 }, (_, i) => makeScoredIssue({ number: i + 1 }))
    setupDeps([makeRawIssue()], scored)

    const result = await fetchIssueListPage({ ...baseArgs, offset: 10 })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.offset).toBe(10)
    expect(result.issues).toHaveLength(PAGE_SIZE)
    expect(result.issues[0].number).toBe(11)
  })
})

describe('fetchIssueListPage — 북마크 병합', () => {
  it('북마크 키와 일치하는 이슈에 isBookmarked=true를 설정한다', async () => {
    const scored = [
      makeScoredIssue({ repoFullName: 'owner/repo', number: 1 }),
      makeScoredIssue({ repoFullName: 'owner/repo', number: 2 }),
    ]
    mockSearch.mockResolvedValue(makeSearchResult({ issues: [makeRawIssue()] }))

    mockBookmarks.mockResolvedValue(['owner/repo#1'])
    mockRank.mockReturnValue(scored)
    mockFilter.mockImplementation((issues) => issues)

    const result = await fetchIssueListPage(baseArgs)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.issues[0].isBookmarked).toBe(true)
    expect(result.issues[1].isBookmarked).toBe(false)
  })
})

describe('fetchIssueListPage — 필터 전달', () => {
  it('applyFilters가 전달받은 filters로 호출된다', async () => {
    const scored = [makeScoredIssue()]
    const filters = { ...EMPTY_ISSUE_FILTERS, minScore: 90 as const }
    setupDeps([makeRawIssue()], scored)

    await fetchIssueListPage({ ...baseArgs, filters })

    expect(mockFilter).toHaveBeenCalledWith(expect.any(Array), filters)
  })

  it('applyFilters 결과 길이가 total에 반영된다', async () => {
    const allScored = Array.from({ length: 15 }, (_, i) => makeScoredIssue({ number: i + 1 }))
    mockSearch.mockResolvedValue(makeSearchResult({ issues: [makeRawIssue()] }))

    mockBookmarks.mockResolvedValue([])
    mockRank.mockReturnValue(allScored)
    // minScore 필터가 걸려 3개만 남는 상황을 시뮬레이션
    mockFilter.mockReturnValue(allScored.slice(0, 3))

    const result = await fetchIssueListPage(baseArgs)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.total).toBe(3)
    expect(result.issues).toHaveLength(3)
  })

  it('필터가 없으면 background 구간에서 이슈가 PAGE_SIZE 미만이어도 GitHub 다음 배치 커서를 반환한다', async () => {
    const scored = Array.from({ length: PAGE_SIZE - 1 }, (_, i) => makeScoredIssue({ number: i + 1 }))
    mockSearch.mockResolvedValue(
      makeSearchResult({ issues: [makeRawIssue()], hasMoreOnGithub: true, endCursor: 'cursor-xyz' })
    )

    mockBookmarks.mockResolvedValue([])
    mockRank.mockReturnValue(scored)
    mockFilter.mockReturnValue(scored)

    // offset을 background 구간으로 줘서 foreground total 보정 로직과 무관하게 진짜 소진 여부를 검증한다
    const result = await fetchIssueListPage({ ...baseArgs, offset: FOREGROUND_FETCH_SIZE })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.total).toBe(PAGE_SIZE - 1)
    expect(result.nextBatch).not.toBeNull()
    expect(result.hasMore).toBe(true)
    expect(result.canLoadMoreCandidates).toBe(false)
  })

  it('활성 필터 결과가 PAGE_SIZE 미만이면 GitHub 다음 배치를 자동 요청하지 않는다', async () => {
    // 90+ 점수나 5000+ 스타처럼 엄격한 조건에서 빈 배치를 계속 넘기지 않도록 끊는다.
    const allScored = Array.from({ length: 20 }, (_, i) => makeScoredIssue({ number: i + 1 }))
    mockSearch.mockResolvedValue(
      makeSearchResult({ issues: [makeRawIssue()], hasMoreOnGithub: true, endCursor: 'cursor-xyz' })
    )

    mockBookmarks.mockResolvedValue([])
    mockRank.mockReturnValue(allScored)
    mockFilter.mockReturnValue(allScored.slice(0, PAGE_SIZE - 1))

    const result = await fetchIssueListPage({
      ...baseArgs,
      filters: { ...EMPTY_ISSUE_FILTERS, minScore: 90 },
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.total).toBe(PAGE_SIZE - 1)
    expect(result.nextBatch).not.toBeNull()
    expect(result.hasMore).toBe(false)
    expect(result.canLoadMoreCandidates).toBe(true)
  })

  it('활성 필터의 마지막 로컬 페이지가 PAGE_SIZE 미만이면 다음 GitHub 배치를 요청하지 않는다', async () => {
    const allScored = Array.from({ length: PAGE_SIZE + 5 }, (_, i) => makeScoredIssue({ number: i + 1 }))
    mockSearch.mockResolvedValue(
      makeSearchResult({ issues: [makeRawIssue()], hasMoreOnGithub: true, endCursor: 'cursor-xyz' })
    )

    mockBookmarks.mockResolvedValue([])
    mockRank.mockReturnValue(allScored)
    mockFilter.mockReturnValue(allScored)

    const result = await fetchIssueListPage({
      ...baseArgs,
      offset: PAGE_SIZE,
      filters: { ...EMPTY_ISSUE_FILTERS, minStars: 3000 },
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.issues).toHaveLength(5)
    expect(result.nextBatch).not.toBeNull()
    expect(result.hasMore).toBe(false)
    expect(result.canLoadMoreCandidates).toBe(true)
  })

  it('availableLanguages는 필터 적용 전 rankedIssues 기준으로 수집된다', async () => {
    // language 필터를 걸어도 UI의 언어 선택지는 전체 배치 기준으로 제공해야 한다
    const allScored = [
      makeScoredIssue({ number: 1, language: 'TypeScript' }),
      makeScoredIssue({ number: 2, language: 'Go' }),
      makeScoredIssue({ number: 3, language: 'Python' }),
    ]
    mockSearch.mockResolvedValue(makeSearchResult({ issues: [makeRawIssue()] }))

    mockBookmarks.mockResolvedValue([])
    mockRank.mockReturnValue(allScored)
    // TypeScript 이슈만 필터를 통과하는 상황
    mockFilter.mockReturnValue([allScored[0]])

    const result = await fetchIssueListPage(baseArgs)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    // 필터 결과(1개)와 무관하게 배치 전체 언어 3종이 반환된다
    expect(result.availableLanguages).toHaveLength(3)
    expect(result.availableLanguages).toEqual(expect.arrayContaining(['TypeScript', 'Go', 'Python']))
  })
})

describe('fetchIssueListPage — 캐시 키', () => {
  it('캐시 키에 batchParam이 포함된다', async () => {
    setupDeps([makeRawIssue()], [makeScoredIssue()])

    await fetchIssueListPage({ ...baseArgs, batchParam: 'cursor-ts' })

    const cacheKey = vi.mocked(unstable_cache).mock.calls[0][1] as string[]
    expect(cacheKey).toContain('cursor-ts')
  })
})

describe('fetchIssueListPage — 메타데이터', () => {
  it('availableLanguages는 null을 제외한 중복 없는 언어 목록이다', async () => {
    const scored = [
      makeScoredIssue({ language: 'TypeScript' }),
      makeScoredIssue({ language: 'TypeScript' }),
      makeScoredIssue({ language: 'Go' }),
      makeScoredIssue({ language: null }),
    ]
    setupDeps([makeRawIssue()], scored)

    const result = await fetchIssueListPage(baseArgs)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.availableLanguages).toEqual(expect.arrayContaining(['TypeScript', 'Go']))
    expect(result.availableLanguages).toHaveLength(2)
  })
})
