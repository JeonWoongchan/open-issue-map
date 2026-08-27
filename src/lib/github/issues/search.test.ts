import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildExploreQuery, fetchCandidateIssues, fetchExploreIssues } from '@/lib/github/issues/search'
import { GitHubInvalidCursorError, GitHubRateLimitError, GitHubUnauthorizedError } from '@/lib/github/client'

vi.mock('@/lib/github/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github/client')>()
  return { ...actual, githubGraphQL: vi.fn() }
})

import { githubGraphQL } from '@/lib/github/client'
const mockGraphQL = vi.mocked(githubGraphQL)

afterEach(() => vi.clearAllMocks())

function makeSearchPage(
  urls: string[],
  hasNextPage = false,
  endCursor: string | null = null
) {
  return {
    search: {
      pageInfo: { hasNextPage, endCursor },
      nodes: urls.map((url) => ({ url, repository: { stargazerCount: 100 } } as never)),
    },
  }
}

describe('fetchCandidateIssues', () => {
  it('언어 배열이 비어있으면 GitHub 호출 없이 빈 결과를 즉시 반환한다', async () => {
    const result = await fetchCandidateIssues([], 'token', null, 30)

    expect(mockGraphQL).not.toHaveBeenCalled()
    expect(result).toEqual({ issues: [], endCursor: null, hasMoreOnGithub: false })
  })

  it('여러 언어를 하나의 쿼리에 담아 한 번만 요청한다', async () => {
    mockGraphQL.mockResolvedValueOnce(makeSearchPage(['https://github.com/a/b/issues/1'], true, 'cursor-1'))

    const result = await fetchCandidateIssues(['TypeScript', 'JavaScript', 'Python'], 'token', null, 30)

    expect(mockGraphQL).toHaveBeenCalledTimes(1)
    const [, variables] = mockGraphQL.mock.calls[0] as unknown as [string, { query: string; first: number; after: string | null }]
    expect(variables.query).toBe('is:open is:issue label:"help wanted" language:TypeScript language:JavaScript language:Python sort:updated-desc')
    expect(variables.first).toBe(30)
    expect(variables.after).toBeNull()
    expect(result.issues).toHaveLength(1)
    expect(result.endCursor).toBe('cursor-1')
    expect(result.hasMoreOnGithub).toBe(true)
  })

  it('sort 인자를 넘기면 쿼리의 sort qualifier가 바뀐다', async () => {
    mockGraphQL.mockResolvedValueOnce(makeSearchPage([]))

    await fetchCandidateIssues(['TypeScript'], 'token', null, 50, 'reactions-desc')

    const [, variables] = mockGraphQL.mock.calls[0] as unknown as [string, { query: string }]
    expect(variables.query).toBe('is:open is:issue label:"help wanted" language:TypeScript sort:reactions-desc')
  })

  it('PR 존재 확인용 timelineItems는 1개와 typename만 요청한다', async () => {
    mockGraphQL.mockResolvedValueOnce(makeSearchPage([]))

    await fetchCandidateIssues(['TypeScript'], 'token', null, 50)

    const [query] = mockGraphQL.mock.calls[0] as unknown as [string]
    expect(query).toContain('timelineItems(first: 1, itemTypes: [CROSS_REFERENCED_EVENT])')
    expect(query).toContain('nodes { __typename }')
    expect(query).not.toContain('source {')
    expect(query).not.toContain('timelineItems(first: 5')
  })

  it('sort 인자를 생략하면 기존과 동일하게 updated-desc를 쓴다', async () => {
    mockGraphQL.mockResolvedValueOnce(makeSearchPage([]))

    await fetchCandidateIssues(['TypeScript'], 'token', null, 30)

    const [, variables] = mockGraphQL.mock.calls[0] as unknown as [string, { query: string }]
    expect(variables.query).toContain('sort:updated-desc')
  })

  it('extraQualifiers를 넘기면 쿼리에 그대로 추가된다', async () => {
    mockGraphQL.mockResolvedValueOnce(makeSearchPage([]))

    await fetchCandidateIssues(['TypeScript'], 'token', null, 50, 'reactions-desc', 'created:>=2024-01-01')

    const [, variables] = mockGraphQL.mock.calls[0] as unknown as [string, { query: string }]
    expect(variables.query).toBe('is:open is:issue label:"help wanted" language:TypeScript created:>=2024-01-01 sort:reactions-desc')
  })

  it('after cursor를 그대로 전달한다', async () => {
    mockGraphQL.mockResolvedValueOnce(makeSearchPage([]))

    await fetchCandidateIssues(['TypeScript'], 'token', 'cursor-abc', 100)

    const [, variables] = mockGraphQL.mock.calls[0] as unknown as [string, { after: string | null; first: number }]
    expect(variables.after).toBe('cursor-abc')
    expect(variables.first).toBe(100)
  })

  it('중복 URL의 이슈는 하나만 남긴다', async () => {
    const sameUrl = 'https://github.com/a/b/issues/1'
    mockGraphQL.mockResolvedValueOnce(makeSearchPage([sameUrl, sameUrl]))

    const result = await fetchCandidateIssues(['TypeScript'], 'token', null, 30)

    expect(result.issues).toHaveLength(1)
  })

  it('star 수와 무관하게 모든 이슈를 그대로 반환한다(star 필터는 사용자 UI 필터에서 처리)', async () => {
    mockGraphQL.mockResolvedValueOnce({
      search: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          { url: 'https://github.com/a/b/issues/1', repository: { stargazerCount: 0 } },
          { url: 'https://github.com/c/d/issues/2', repository: { stargazerCount: 5000 } },
        ] as never,
      },
    })

    const result = await fetchCandidateIssues(['TypeScript'], 'token', null, 30)

    expect(result.issues).toHaveLength(2)
  })

  it('INVALID_CURSOR_ARGUMENTS면 첫 페이지(after: null)로 한 번 더 재시도한다', async () => {
    mockGraphQL
      .mockRejectedValueOnce(new GitHubInvalidCursorError('`cursor:100` does not appear to be a valid cursor.'))
      .mockResolvedValueOnce(makeSearchPage(['https://github.com/a/b/issues/1'], true, 'cursor-fresh'))

    const result = await fetchCandidateIssues(['TypeScript'], 'token', 'cursor:100', 30)

    expect(mockGraphQL).toHaveBeenCalledTimes(2)
    expect(mockGraphQL.mock.calls[1][1]).toMatchObject({ after: null })
    expect(result.issues).toHaveLength(1)
    expect(result.endCursor).toBe('cursor-fresh')
  })

  it('첫 페이지 재조회도 INVALID_CURSOR_ARGUMENTS면 그대로 throw한다', async () => {
    mockGraphQL
      .mockRejectedValueOnce(new GitHubInvalidCursorError('bad cursor'))
      .mockRejectedValueOnce(new GitHubInvalidCursorError('bad cursor'))

    await expect(fetchCandidateIssues(['TypeScript'], 'token', 'cursor:100', 30))
      .rejects.toBeInstanceOf(GitHubInvalidCursorError)
  })

  it('GitHubRateLimitError는 그대로 호출부로 전파된다', async () => {
    mockGraphQL.mockRejectedValueOnce(new GitHubRateLimitError())

    await expect(fetchCandidateIssues(['TypeScript'], 'token', null, 30))
      .rejects.toBeInstanceOf(GitHubRateLimitError)
  })

  it('GitHubUnauthorizedError는 그대로 호출부로 전파된다', async () => {
    mockGraphQL.mockRejectedValueOnce(new GitHubUnauthorizedError())

    await expect(fetchCandidateIssues(['TypeScript'], 'token', null, 30))
      .rejects.toBeInstanceOf(GitHubUnauthorizedError)
  })
})

describe('buildExploreQuery', () => {
  it('검색어·언어·라벨이 모두 없으면 기본값으로 help wanted 라벨과 updated-desc 정렬을 쓴다', () => {
    const query = buildExploreQuery({ text: '', languages: [], githubLabel: null, sort: 'latest' })
    expect(query).toBe('is:open is:issue label:"help wanted" sort:updated-desc')
  })

  it('검색어가 있으면 기본 help wanted 라벨 제약을 걷어낸다', () => {
    const query = buildExploreQuery({ text: 'kubectl bug', languages: [], githubLabel: null, sort: 'latest' })
    expect(query).toBe('is:open is:issue kubectl bug sort:updated-desc')
  })

  it('githubLabel이 있으면 검색어가 있어도 그 라벨을 그대로 쓴다', () => {
    const query = buildExploreQuery({ text: 'foo', languages: [], githubLabel: 'bug', sort: 'latest' })
    expect(query).toBe('is:open is:issue label:"bug" foo sort:updated-desc')
  })

  it('언어 여러 개는 반복되는 language: qualifier로 들어간다(OR로 해석됨)', () => {
    const query = buildExploreQuery({ text: '', languages: ['TypeScript', 'JavaScript'], githubLabel: null, sort: 'latest' })
    expect(query).toBe('is:open is:issue label:"help wanted" language:TypeScript language:JavaScript sort:updated-desc')
  })

  it('sort가 popular이면 reactions-desc 정렬과 최근 N일 윈도우 qualifier가 붙는다', () => {
    const query = buildExploreQuery({ text: '', languages: [], githubLabel: null, sort: 'popular' })
    expect(query).toContain('sort:reactions-desc')
    expect(query).toMatch(/created:>=\d{4}-\d{2}-\d{2}/)
  })
})

describe('fetchExploreIssues', () => {
  it('주어진 쿼리·커서·개수 그대로 GitHub에 요청한다', async () => {
    mockGraphQL.mockResolvedValueOnce(makeSearchPage(['https://github.com/a/b/issues/1'], true, 'cursor-2'))

    const result = await fetchExploreIssues('is:open is:issue label:"help wanted" sort:updated-desc', 'token', 'cursor-1', 24)

    const [, variables] = mockGraphQL.mock.calls[0] as unknown as [string, { query: string; first: number; after: string | null }]
    expect(variables.query).toBe('is:open is:issue label:"help wanted" sort:updated-desc')
    expect(variables.after).toBe('cursor-1')
    expect(variables.first).toBe(24)
    expect(result.endCursor).toBe('cursor-2')
    expect(result.hasMoreOnGithub).toBe(true)
  })

  it('INVALID_CURSOR_ARGUMENTS면 첫 페이지로 한 번 더 재시도한다', async () => {
    mockGraphQL
      .mockRejectedValueOnce(new GitHubInvalidCursorError('bad cursor'))
      .mockResolvedValueOnce(makeSearchPage([]))

    await fetchExploreIssues('is:open is:issue', 'token', 'cursor:100', 24)

    expect(mockGraphQL).toHaveBeenCalledTimes(2)
    expect(mockGraphQL.mock.calls[1][1]).toMatchObject({ after: null })
  })
})
