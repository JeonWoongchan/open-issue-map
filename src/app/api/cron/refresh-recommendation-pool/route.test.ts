import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { ErrorCode } from '@/lib/api-response'
import {
  GitHubRateLimitError,
  GitHubResourceLimitError,
  GitHubTimeoutError,
  GitHubUnauthorizedError,
} from '@/lib/github/client'

vi.mock('@/lib/github/issues/recommendations', () => ({
  refreshCandidatePool: vi.fn(),
}))

import { POST } from '@/app/api/cron/refresh-recommendation-pool/route'
import { refreshCandidatePool } from '@/lib/github/issues/recommendations'

const mockRefresh = vi.mocked(refreshCandidatePool)
const originalCronSecret = process.env.CRON_SECRET
const originalGithubToken = process.env.GITHUB_TOKEN

function req() {
  return new NextRequest(
    'http://localhost/api/cron/refresh-recommendation-pool?condition=popular&language=Python',
    { method: 'POST', headers: { authorization: 'Bearer cron-secret' } },
  )
}

beforeEach(() => {
  process.env.CRON_SECRET = 'cron-secret'
  process.env.GITHUB_TOKEN = 'github-token'
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = originalCronSecret
  if (originalGithubToken === undefined) delete process.env.GITHUB_TOKEN
  else process.env.GITHUB_TOKEN = originalGithubToken
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('POST /api/cron/refresh-recommendation-pool', () => {
  it('갱신에 성공하면 조건과 언어를 반환한다', async () => {
    mockRefresh.mockResolvedValueOnce({
      refreshStatus: 'stored',
      fetchedCount: 300,
      candidateCount: 300,
      storedCount: 300,
      previousCount: 250,
      requestCount: 3,
      degraded: false,
      stopReason: 'target_reached',
    })

    const res = await POST(req())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      data: {
        condition: 'popular',
        language: 'Python',
        refreshStatus: 'stored',
        requestCount: 3,
      },
    })
  })

  it.each([
    [new GitHubResourceLimitError(), 503, ErrorCode.GITHUB_RESOURCE_LIMIT],
    [new GitHubRateLimitError(), 429, ErrorCode.RATE_LIMITED],
    [new GitHubTimeoutError(), 504, ErrorCode.GITHUB_TIMEOUT],
    [new GitHubUnauthorizedError(), 502, ErrorCode.GITHUB_AUTH_ERROR],
  ])('GitHub 오류 종류를 HTTP 상태와 코드로 구분한다', async (error, status, code) => {
    mockRefresh.mockRejectedValueOnce(error)

    const res = await POST(req())
    const json = await res.json()

    expect(res.status).toBe(status)
    expect(json).toMatchObject({ ok: false, error: { code } })
  })

  it('DB 저장 등 내부 오류는 GitHub 502가 아니라 500으로 반환한다', async () => {
    mockRefresh.mockRejectedValueOnce(new Error('database failed'))

    const res = await POST(req())
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toMatchObject({ ok: false, error: { code: ErrorCode.INTERNAL_ERROR } })
  })

  it('GitHub 429의 Retry-After를 호출자에게 전달한다', async () => {
    mockRefresh.mockRejectedValueOnce(new GitHubRateLimitError({ retryAfter: '75' }))

    const res = await POST(req())

    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('75')
  })
})
