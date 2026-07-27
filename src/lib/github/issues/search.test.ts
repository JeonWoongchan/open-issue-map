import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchCandidateIssues } from '@/lib/github/issues/search'
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
