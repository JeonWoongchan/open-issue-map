import { describe, it, expect, vi, afterEach } from 'vitest'
import { POST } from '@/app/api/ai/issue-analysis/route'
import { ErrorCode } from '@/lib/api-response'
import type { Mock } from 'vitest'
import type { Session } from 'next-auth'
import type { IssueAnalysis } from '@/lib/ai/types'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/ai', () => ({ createAiProvider: vi.fn() }))
vi.mock('@/lib/ai/guest-usage', () => ({ checkAndIncrementGuestUsage: vi.fn() }))
vi.mock('@/lib/user/profile', () => ({ loadOnboardingProfile: vi.fn() }))
vi.mock('@/lib/github/readme', () => ({ getContributingGuide: vi.fn() }))

import { auth } from '@/lib/auth'
import { createAiProvider } from '@/lib/ai'
import { checkAndIncrementGuestUsage } from '@/lib/ai/guest-usage'
import { loadOnboardingProfile } from '@/lib/user/profile'
import { getContributingGuide } from '@/lib/github/readme'

const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>
const mockCreateProvider = vi.mocked(createAiProvider)
const mockGuestUsage = vi.mocked(checkAndIncrementGuestUsage)
const mockLoadProfile = vi.mocked(loadOnboardingProfile)
const mockContributing = vi.mocked(getContributingGuide)

afterEach(() => {
    vi.restoreAllMocks()
    vi.resetAllMocks()   // Once 큐까지 초기화 — clearAllMocks는 큐를 남겨 mock 누출 발생
    vi.unstubAllEnvs()
})

// ─── 픽스처 ───────────────────────────────────────────────────────────────────

const session = {
    user: { id: 'user-1', login: 'tester', isOnboarded: true },
    expires: '2099-01-01T00:00:00.000Z',
} satisfies Session

const validBody = {
    title: 'Fix login bug',
    body: 'The login button does not work on mobile.',
    labels: ['bug', 'mobile'],
    language: 'TypeScript',
    repoFullName: 'owner/repo',
}

const analysisResult: IssueAnalysis = {
    concepts: ['React 이벤트 핸들링', 'OAuth 플로우'],
    scope: '로그인 버튼 클릭 핸들러 수정, 약 20줄 변경 예상',
    startingPoints: ['src/components/LoginButton.tsx', 'src/lib/auth.ts'],
    cautions: ['모바일 터치 이벤트와 클릭 이벤트 차이 확인 필요'],
    difficulty: '쉬움',
}

const userProfile = {
    topLanguages: ['TypeScript'],
    experienceLevel: 'junior' as const,
    contributionTypes: ['bug' as const],
    weeklyHours: 5 as const,
    purpose: 'portfolio' as const,
}

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function authOk() {
    mockAuth.mockResolvedValueOnce(session)
    mockLoadProfile.mockResolvedValueOnce(userProfile)
    mockContributing.mockResolvedValueOnce(null)
}

function authGuest() {
    mockAuth.mockResolvedValueOnce(null)
    mockContributing.mockResolvedValueOnce(null)
}

function apiKeyOk() {
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
}

function guestAllowed(remaining = 4) {
    mockGuestUsage.mockResolvedValueOnce({ allowed: true, remaining })
}

function guestExceeded() {
    mockGuestUsage.mockResolvedValueOnce({ allowed: false, remaining: 0 })
}

function makeProvider(analyzeIssueImpl = vi.fn().mockResolvedValue(analysisResult)) {
    const provider = { analyzeIssue: analyzeIssueImpl }
    mockCreateProvider.mockReturnValue(provider)
    return provider
}

function silenceConsoleError() {
    return vi.spyOn(console, 'error').mockImplementation(() => undefined)
}

type ReqOptions = {
    forwardedFor?: string  // x-forwarded-for 헤더
    realIp?: string        // x-real-ip 헤더
}

function makeReq(body: unknown, options: ReqOptions = {}) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (options.forwardedFor) headers['x-forwarded-for'] = options.forwardedFor
    if (options.realIp) headers['x-real-ip'] = options.realIp
    return new Request('http://localhost/api/ai/issue-analysis', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    })
}

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('POST /api/ai/issue-analysis', () => {
    describe('게스트 한도', () => {
        it('비로그인 + 한도 초과 시 429를 반환한다', async () => {
            authGuest()
            guestExceeded()
            apiKeyOk()

            const res = await POST(makeReq(validBody, { forwardedFor: '1.2.3.4' }))
            const json = await res.json()

            expect(res.status).toBe(429)
            expect(json.ok).toBe(false)
            expect(json.error.code).toBe(ErrorCode.RATE_LIMITED)
        })

        it('비로그인 + 한도 미달 시 AI 분석을 허용한다', async () => {
            authGuest()
            guestAllowed()
            apiKeyOk()
            makeProvider()

            const res = await POST(makeReq(validBody, { forwardedFor: '1.2.3.4' }))
            const json = await res.json()

            expect(res.status).toBe(200)
            expect(json.ok).toBe(true)
            expect(json.data).toEqual(analysisResult)
        })

        it('IP를 식별할 수 없는 경우 unknown 버킷으로 게스트 체크를 수행한다', async () => {
            authGuest()
            guestAllowed()
            apiKeyOk()
            makeProvider()

            // x-forwarded-for, x-real-ip 모두 없는 요청 → 'unknown' 공유 버킷으로 처리
            const res = await POST(makeReq(validBody))

            expect(res.status).toBe(200)
            expect(mockGuestUsage).toHaveBeenCalledWith('unknown')
        })
    })

    describe('IP 추출 우선순위', () => {
        it('x-real-ip를 x-forwarded-for보다 우선해 사용한다', async () => {
            authGuest()
            guestAllowed()
            apiKeyOk()
            makeProvider()

            await POST(makeReq(validBody, { realIp: '10.0.0.1', forwardedFor: '1.2.3.4' }))

            // x-forwarded-for 조작 시에도 x-real-ip 값이 사용되어야 한다
            expect(mockGuestUsage).toHaveBeenCalledWith('10.0.0.1')
        })

        it('x-real-ip만 있으면 해당 값을 그대로 사용한다', async () => {
            authGuest()
            guestAllowed()
            apiKeyOk()
            makeProvider()

            await POST(makeReq(validBody, { realIp: '10.0.0.2' }))

            expect(mockGuestUsage).toHaveBeenCalledWith('10.0.0.2')
        })

        it('x-forwarded-for만 있으면 첫 번째 IP만 추출한다', async () => {
            authGuest()
            guestAllowed()
            apiKeyOk()
            makeProvider()

            // 프록시 체인 — 첫 번째가 원본 클라이언트 IP
            await POST(makeReq(validBody, { forwardedFor: '5.6.7.8, 192.168.0.1, 10.0.0.3' }))

            expect(mockGuestUsage).toHaveBeenCalledWith('5.6.7.8')
        })
    })

    describe('요청 검증', () => {
        it('body가 JSON이 아니면 400을 반환한다', async () => {
            authOk()
            apiKeyOk()

            const res = await POST(new Request('http://localhost/api/ai/issue-analysis', {
                method: 'POST',
                body: 'not-json',
            }))

            expect(res.status).toBe(400)
            expect((await res.json()).error.code).toBe(ErrorCode.INVALID_REQUEST)
        })

        it('title이 빈 문자열이면 400을 반환한다', async () => {
            authOk()
            apiKeyOk()

            const res = await POST(makeReq({ ...validBody, title: '' }))

            expect(res.status).toBe(400)
            expect((await res.json()).error.code).toBe(ErrorCode.INVALID_REQUEST)
        })

        it('repoFullName이 누락되면 400을 반환한다', async () => {
            authOk()
            apiKeyOk()
            const { repoFullName: _omit, ...invalid } = validBody

            const res = await POST(makeReq(invalid))

            expect(res.status).toBe(400)
        })

        it('labels가 없으면 400을 반환한다', async () => {
            authOk()
            apiKeyOk()
            const { labels: _omit, ...invalid } = validBody

            const res = await POST(makeReq(invalid))

            expect(res.status).toBe(400)
        })
    })

    describe('환경 변수', () => {
        it('GEMINI_API_KEY 미설정 시 503을 반환한다', async () => {
            vi.stubEnv('GEMINI_API_KEY', '')

            const res = await POST(makeReq(validBody))
            const json = await res.json()

            expect(res.status).toBe(503)
            expect(json.ok).toBe(false)
            expect(json.error.code).toBe(ErrorCode.INTERNAL_ERROR)
        })
    })

    describe('정상 흐름 (로그인)', () => {
        it('로그인 사용자는 한도 없이 200과 분석 결과를 반환한다', async () => {
            authOk()
            apiKeyOk()
            makeProvider()

            const res = await POST(makeReq(validBody))
            const json = await res.json()

            expect(res.status).toBe(200)
            expect(json.ok).toBe(true)
            expect(json.data).toEqual(analysisResult)
            // 로그인 사용자는 게스트 카운트를 호출하지 않는다
            expect(mockGuestUsage).not.toHaveBeenCalled()
        })

        it('body와 language가 null이어도 200을 반환한다', async () => {
            authOk()
            apiKeyOk()
            makeProvider()

            const res = await POST(makeReq({ ...validBody, body: null, language: null }))
            const json = await res.json()

            expect(res.status).toBe(200)
            expect(json.ok).toBe(true)
        })

        it('검증된 필드를 그대로 analyzeIssue에 전달한다', async () => {
            authOk()
            apiKeyOk()
            const provider = makeProvider()

            await POST(makeReq(validBody))

            expect(provider.analyzeIssue).toHaveBeenCalledWith({
                ...validBody,
                userExperienceLevel: userProfile.experienceLevel,
                userPurpose: userProfile.purpose,
                userWeeklyHours: userProfile.weeklyHours,
                contributingGuide: null,
            })
        })
    })

    describe('AI 분석 실패', () => {
        it('analyzeIssue 예외 발생 시 500을 반환한다', async () => {
            const consoleError = silenceConsoleError()
            authOk()
            apiKeyOk()
            makeProvider(vi.fn().mockRejectedValue(new Error('Gemini API error')))

            const res = await POST(makeReq(validBody))
            const json = await res.json()

            expect(res.status).toBe(500)
            expect(json.ok).toBe(false)
            expect(json.error.code).toBe(ErrorCode.INTERNAL_ERROR)
            expect(consoleError).toHaveBeenCalledOnce()
        })
    })
})
