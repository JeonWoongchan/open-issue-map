import { describe, it, expect, vi, afterEach } from 'vitest'
import { POST } from '@/app/api/ai/issue-analysis/route'
import { ErrorCode } from '@/lib/api-response'
import type { Mock } from 'vitest'
import type { Session } from 'next-auth'
import type { IssueAnalysis } from '@/lib/ai/types'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/ai', () => ({ createAiProvider: vi.fn() }))

import { auth } from '@/lib/auth'
import { createAiProvider } from '@/lib/ai'

const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>
const mockCreateProvider = vi.mocked(createAiProvider)

afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
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

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function authOk() {
    mockAuth.mockResolvedValueOnce(session)
}

function apiKeyOk() {
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
}

function makeProvider(analyzeIssueImpl = vi.fn().mockResolvedValue(analysisResult)) {
    const provider = { analyzeIssue: analyzeIssueImpl }
    mockCreateProvider.mockReturnValue(provider)
    return provider
}

function silenceConsoleError() {
    return vi.spyOn(console, 'error').mockImplementation(() => undefined)
}

function makeReq(body: unknown) {
    return new Request('http://localhost/api/ai/issue-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('POST /api/ai/issue-analysis', () => {
    describe('인증', () => {
        it('미로그인 시 401을 반환한다', async () => {
            mockAuth.mockResolvedValueOnce(null)

            const res = await POST(makeReq(validBody))
            const json = await res.json()

            expect(res.status).toBe(401)
            expect(json.ok).toBe(false)
            expect(json.error.code).toBe(ErrorCode.UNAUTHORIZED)
        })
    })

    describe('요청 검증', () => {
        it('body가 JSON이 아니면 400을 반환한다', async () => {
            authOk()

            const res = await POST(new Request('http://localhost/api/ai/issue-analysis', {
                method: 'POST',
                body: 'not-json',
            }))

            expect(res.status).toBe(400)
            expect((await res.json()).error.code).toBe(ErrorCode.INVALID_REQUEST)
        })

        it('title이 빈 문자열이면 400을 반환한다', async () => {
            authOk()

            const res = await POST(makeReq({ ...validBody, title: '' }))

            expect(res.status).toBe(400)
            expect((await res.json()).error.code).toBe(ErrorCode.INVALID_REQUEST)
        })

        it('repoFullName이 누락되면 400을 반환한다', async () => {
            authOk()
            const { repoFullName: _omit, ...invalid } = validBody

            const res = await POST(makeReq(invalid))

            expect(res.status).toBe(400)
        })

        it('labels가 없으면 400을 반환한다', async () => {
            authOk()
            const { labels: _omit, ...invalid } = validBody

            const res = await POST(makeReq(invalid))

            expect(res.status).toBe(400)
        })
    })

    describe('환경 변수', () => {
        it('GEMINI_API_KEY 미설정 시 503을 반환한다', async () => {
            authOk()
            // GEMINI_API_KEY를 빈 값으로 설정 — 미설정 상태 재현
            vi.stubEnv('GEMINI_API_KEY', '')

            const res = await POST(makeReq(validBody))
            const json = await res.json()

            expect(res.status).toBe(503)
            expect(json.ok).toBe(false)
            expect(json.error.code).toBe(ErrorCode.INTERNAL_ERROR)
        })
    })

    describe('정상 흐름', () => {
        it('정상 요청 시 200과 분석 결과를 반환한다', async () => {
            authOk()
            apiKeyOk()
            makeProvider()

            const res = await POST(makeReq(validBody))
            const json = await res.json()

            expect(res.status).toBe(200)
            expect(json.ok).toBe(true)
            expect(json.data).toEqual(analysisResult)
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

            expect(provider.analyzeIssue).toHaveBeenCalledWith(validBody)
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
