import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  githubGraphQL,
  GitHubUnauthorizedError,
  GitHubRateLimitError,
  GitHubNotFoundError,
  GitHubInvalidCursorError,
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
})
