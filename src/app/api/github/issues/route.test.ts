import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { Mock } from 'vitest'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { ErrorCode } from '@/lib/api-response'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }))
vi.mock('@/lib/env', () => ({ env: { AUTH_SECRET: 'secret' } }))
vi.mock('@/lib/user/profile', () => ({ loadOnboardingProfile: vi.fn() }))
vi.mock('@/lib/github/issues/service', () => ({ fetchIssueExplorePage: vi.fn() }))
vi.mock('@/lib/github/error-response', () => ({
  GITHUB_RATE_LIMITED_MESSAGE: 'GitHub API 요청 한도를 초과했습니다.',
  GITHUB_UNAUTHORIZED_MESSAGE: 'GitHub 인증이 만료되었습니다. 다시 로그인해 주세요.',
}))

import { GET } from '@/app/api/github/issues/route'
import { auth } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'
import { loadOnboardingProfile } from '@/lib/user/profile'
import { fetchIssueExplorePage } from '@/lib/github/issues/service'

const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>
const mockGetToken = getToken as unknown as Mock<() => Promise<JWT | null>>
const mockProfile = vi.mocked(loadOnboardingProfile)
const mockFetch = vi.mocked(fetchIssueExplorePage)

const originalGithubToken = process.env.GITHUB_TOKEN

const session = {
  user: {
    id: 'user-1',
    login: 'testuser',
    isOnboarded: true,
  },
  expires: '2099-01-01T00:00:00.000Z',
} satisfies Session

const profile = {
  topLanguages: ['TypeScript'],
  experienceLevel: 'mid' as const,
  contributionTypes: ['bug' as const],
  weeklyHours: 5 as const,
  purpose: 'growth' as const,
}

const issueData = {
  issues: [],
  hasMore: false,
  offset: 0,
  batch: 'initial',
  nextBatch: null,
}

beforeEach(() => {
  delete process.env.GITHUB_TOKEN
})

afterEach(() => {
  if (originalGithubToken === undefined) {
    delete process.env.GITHUB_TOKEN
  } else {
    process.env.GITHUB_TOKEN = originalGithubToken
  }
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

function authOk() {
  mockAuth.mockResolvedValue(session)
  mockGetToken.mockResolvedValue({ accessToken: 'token', githubLogin: 'testuser' } as JWT)
}

function req(params = '') {
  return new NextRequest(`http://localhost/api/github/issues${params}`)
}

function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => undefined)
}

describe('GET /api/github/issues', () => {
  it('게스트 요청에서 서버 GitHub 토큰이 없으면 401을 반환한다', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error?.code).toBe(ErrorCode.UNAUTHORIZED)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('게스트 요청은 서버 GitHub 토큰과 기본 프로필로 이슈를 조회한다', async () => {
    process.env.GITHUB_TOKEN = 'guest-token'
    mockAuth.mockResolvedValue(null)
    mockFetch.mockResolvedValue(issueData)

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        accessToken: 'guest-token',
      })
    )
  })

  it('로그인 세션은 있지만 JWT accessToken이 없으면 401을 반환한다', async () => {
    mockAuth.mockResolvedValue(session)
    mockGetToken.mockResolvedValue(null)

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error?.code).toBe(ErrorCode.NO_ACCESS_TOKEN)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('온보딩 미완료 로그인 사용자는 400 ONBOARDING_REQUIRED를 반환한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(null)

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error?.code).toBe(ErrorCode.ONBOARDING_REQUIRED)
  })

  it('GitHub rate limit 오류는 429를 반환한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'rate_limited' })

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(429)
    expect(json.error?.code).toBe(ErrorCode.RATE_LIMITED)
  })

  it('GitHub unauthorized 오류는 401을 반환한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'unauthorized' })

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error?.code).toBe(ErrorCode.UNAUTHORIZED)
  })

  it('모든 GitHub 쿼리가 실패하면 502를 반환한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'fetch_failed' })

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(502)
    expect(json.error?.code).toBe(ErrorCode.GITHUB_ERROR)
  })

  it('정상 결과를 200으로 반환한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue(issueData)

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.data).toEqual(issueData)
  })

  it('q·sort·githubLabel·batch·offset 쿼리 파라미터를 서비스에 전달한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'fetch_failed' })

    await GET(req('?q=kubectl&sort=popular&githubLabel=bug&batch=cursor-1&offset=30'))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'kubectl', sort: 'popular', githubLabel: 'bug', batch: 'cursor-1', offset: 30 })
    )
  })

  it('batch 파라미터가 없으면 EXPLORE_INITIAL_BATCH를 기본값으로 전달한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'fetch_failed' })

    await GET(req())

    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ batch: 'initial', offset: 0 }))
  })

  it('offset이 음수/비정수면 0으로 폴백한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'fetch_failed' })

    await GET(req('?offset=-5'))

    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }))
  })

  it('sort 파라미터가 popular/latest가 아니면 latest로 폴백한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'fetch_failed' })

    await GET(req('?sort=invalid'))

    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ sort: 'latest' }))
  })

  it('허용된 minScore 쿼리 파라미터를 filters에 담아 전달한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'fetch_failed' })

    await GET(req('?minScore=90'))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ filters: expect.objectContaining({ minScore: 90 }) })
    )
  })

  it('languageGroup 쿼리 파라미터를 GitHub 쿼리용 최상위 값으로 전달한다', async () => {
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockResolvedValue({ error: 'fetch_failed' })

    await GET(req('?languageGroup=typescript'))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ languageGroup: 'typescript' })
    )
  })

  it('예외 발생 시 500을 반환한다', async () => {
    const consoleError = silenceConsoleError()
    authOk()
    mockProfile.mockResolvedValue(profile)
    mockFetch.mockRejectedValue(new Error('unexpected'))

    const res = await GET(req())
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error?.code).toBe(ErrorCode.INTERNAL_ERROR)
    expect(consoleError).toHaveBeenCalledOnce()
  })
})
