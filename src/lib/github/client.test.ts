import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  githubGraphQL,
  GitHubUnauthorizedError,
  GitHubRateLimitError,
  GitHubNotFoundError,
  GitHubInvalidCursorError,
  GitHubResourceLimitError,
  GitHubTimeoutError,
  getGitHubErrorLogFields,
} from '@/lib/github/client'

function stubFetch(status: number, body: object, headers: Record<string, string> = {}) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (key: string) => headers[key] ?? null },
    json: () => Promise.resolve(body),
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('githubGraphQL', () => {
  it('HTTP 401 응답은 GitHubUnauthorizedError를 던진다', async () => {
    stubFetch(401, {})
    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toBeInstanceOf(GitHubUnauthorizedError)
  })

  it('GraphQL errors.type=UNAUTHORIZED는 GitHubUnauthorizedError를 던진다', async () => {
    stubFetch(200, { errors: [{ type: 'UNAUTHORIZED', message: 'Bad credentials' }] })
    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toBeInstanceOf(GitHubUnauthorizedError)
  })

  it('GraphQL errors.type=RATE_LIMITED는 GitHubRateLimitError를 던진다', async () => {
    stubFetch(200, { errors: [{ type: 'RATE_LIMITED' }] })
    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toBeInstanceOf(GitHubRateLimitError)
  })

  it('GraphQL errors.type=NOT_FOUND는 GitHubNotFoundError를 던진다', async () => {
    stubFetch(200, { errors: [{ type: 'NOT_FOUND' }] })
    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toBeInstanceOf(GitHubNotFoundError)
  })

  it('GraphQL errors.type=INVALID_CURSOR_ARGUMENTS는 GitHubInvalidCursorError를 던진다', async () => {
    stubFetch(200, { errors: [{ type: 'INVALID_CURSOR_ARGUMENTS', message: 'not a valid cursor' }] })
    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toBeInstanceOf(GitHubInvalidCursorError)
  })

  it('HTTP 403 + x-ratelimit-remaining=0(primary rate limit)은 GitHubRateLimitError를 던진다', async () => {
    stubFetch(403, {}, { 'x-ratelimit-remaining': '0' })
    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toBeInstanceOf(GitHubRateLimitError)
  })

  it('HTTP 403 + retry-after(secondary rate limit)는 GitHubRateLimitError를 던진다', async () => {
    // x-ratelimit-remaining 헤더가 없는 상태로 옴 — primary 예산과 무관한 별도의 secondary rate limit
    stubFetch(403, { message: 'You have exceeded a secondary rate limit.' }, { 'retry-after': '60' })
    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toBeInstanceOf(GitHubRateLimitError)
  })

  it('HTTP 403인데 rate limit 관련 헤더가 전혀 없으면 일반 에러를 던진다', async () => {
    stubFetch(403, {})
    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toThrow('GitHub GraphQL error: 403')
  })

  it('첫 에러가 아니어도 resource limit 메시지가 있으면 전용 에러를 던진다', async () => {
    stubFetch(200, {
      data: { search: { nodes: [] } },
      errors: [
        { type: 'OTHER', message: 'other error', path: ['search', 'nodes', 1] },
        {
          message: 'Resource limits for this query exceeded',
          path: ['search', 'nodes', 37, 'timelineItems'],
        },
      ],
    }, {
      'x-github-request-id': 'request-123',
      'x-ratelimit-remaining': '4990',
    })

    const promise = githubGraphQL('query {}', {}, 'token')
    await expect(promise).rejects.toBeInstanceOf(GitHubResourceLimitError)
    await expect(promise).rejects.toMatchObject({
      kind: 'resource_limit',
      details: {
        upstreamStatus: 200,
        githubRequestId: 'request-123',
        partialData: true,
        rateLimit: { remaining: '4990' },
        graphqlErrors: [
          { type: 'OTHER', path: ['search', 'nodes', 1] },
          { path: ['search', 'nodes', 37, 'timelineItems'] },
        ],
      },
    })
  })

  it('AbortSignal timeout은 GitHubTimeoutError로 정규화한다', async () => {
    const timeoutError = new Error('request contained sensitive variables')
    timeoutError.name = 'TimeoutError'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutError))

    await expect(githubGraphQL('query {}', {}, 'token')).rejects.toBeInstanceOf(GitHubTimeoutError)
  })

  it('로그 필드는 raw 메시지 대신 허용된 메타데이터만 반환한다', () => {
    const error = new GitHubResourceLimitError({
      githubRequestId: 'request-123',
      graphqlErrors: [{ type: 'RESOURCE_LIMITS_EXCEEDED', path: ['search'] }],
    })

    const fields = getGitHubErrorLogFields(error)
    const serialized = JSON.stringify(fields)

    expect(fields).toMatchObject({
      errorKind: 'resource_limit',
      githubRequestId: 'request-123',
      githubErrorTypes: ['RESOURCE_LIMITS_EXCEEDED'],
      githubErrorPaths: [['search']],
    })
    expect(serialized).not.toContain('Authorization')
    expect(serialized).not.toContain('query')
    expect(serialized).not.toContain('cursor')
  })
})
