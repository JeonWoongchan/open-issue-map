import { describe, it, expect, vi, afterEach } from 'vitest'
import { POST } from '@/app/api/onboarding/route'
import { NextRequest } from 'next/server'
import type { Mock } from 'vitest'
import type { Session } from 'next-auth'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/user/onboarding', () => ({ saveOnboardingSurvey: vi.fn() }))
vi.mock('@/lib/user/onboarding-insight', () => ({ generateAndCacheOnboardingInsight: vi.fn() }))

import { auth } from '@/lib/auth'
import { saveOnboardingSurvey } from '@/lib/user/onboarding'
import { generateAndCacheOnboardingInsight } from '@/lib/user/onboarding-insight'
import { POPULAR_LANGUAGES } from '@/constants/contribution-levels'
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>
const mockSave = vi.mocked(saveOnboardingSurvey)
const mockGenerateInsight = vi.mocked(generateAndCacheOnboardingInsight)

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

const validBody = {
  experienceLevel: 'mid',
  contributionTypes: ['bug'],
  topLanguages: ['TypeScript'],
  weeklyHours: 5,
  purpose: 'growth',
}

const session = {
  user: {
    id: 'user-1',
    login: 'testuser',
    isOnboarded: true,
  },
  expires: '2099-01-01T00:00:00.000Z',
} satisfies Session

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function silenceConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => undefined)
}

describe('POST /api/onboarding', () => {
  it('미로그인 시 401을 반환한다', async () => {
    mockAuth.mockResolvedValueOnce(null)

    const res = await POST(makeReq(validBody))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.ok).toBe(false)
  })

  it('body가 JSON이 아니면 400을 반환한다', async () => {
    mockAuth.mockResolvedValueOnce(session)

    const res = await POST(new NextRequest('http://localhost/api/onboarding', {
      method: 'POST',
      body: 'invalid-json',
    }))

    expect(res.status).toBe(400)
  })

  it('필수 필드 누락 시 400을 반환한다', async () => {
    mockAuth.mockResolvedValueOnce(session)
    const invalid = {
      contributionTypes: validBody.contributionTypes,
      topLanguages: validBody.topLanguages,
      weeklyHours: validBody.weeklyHours,
      purpose: validBody.purpose,
    }

    const res = await POST(makeReq(invalid))

    expect(res.status).toBe(400)
  })

  it('weeklyHours가 허용되지 않는 값이면 400을 반환한다', async () => {
    mockAuth.mockResolvedValueOnce(session)

    const res = await POST(makeReq({ ...validBody, weeklyHours: 3 }))

    expect(res.status).toBe(400)
  })

  it('정상 요청 시 200과 { success: true }를 반환한다', async () => {
    mockAuth.mockResolvedValueOnce(session)
    mockSave.mockResolvedValueOnce(undefined)
    mockGenerateInsight.mockResolvedValueOnce({ status: 'success', adviceItems: ['조언'] })

    const res = await POST(makeReq(validBody))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.data.success).toBe(true)
    expect(mockSave).toHaveBeenCalledWith('user-1', validBody)
    expect(mockGenerateInsight).toHaveBeenCalledWith('user-1', validBody)
  })

  it('전체 언어 선택 payload를 정상 요청으로 처리한다', async () => {
    mockAuth.mockResolvedValueOnce(session)
    mockSave.mockResolvedValueOnce(undefined)
    mockGenerateInsight.mockResolvedValueOnce({ status: 'success', adviceItems: ['조언'] })
    const body = {
      ...validBody,
      experienceLevel: 'senior',
      contributionTypes: ['review', 'test', 'feat', 'bug', 'doc'],
      topLanguages: [...POPULAR_LANGUAGES],
      weeklyHours: 10,
      purpose: 'community',
    }

    const res = await POST(makeReq(body))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(mockSave).toHaveBeenCalledWith('user-1', body)
  })

  it('saveOnboardingSurvey 예외 발생 시 500을 반환한다', async () => {
    const consoleError = silenceConsoleError()
    mockAuth.mockResolvedValueOnce(session)
    mockSave.mockRejectedValue(new Error('DB error'))

    const res = await POST(makeReq(validBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.ok).toBe(false)
    expect(consoleError).toHaveBeenCalledOnce()
  })
})
