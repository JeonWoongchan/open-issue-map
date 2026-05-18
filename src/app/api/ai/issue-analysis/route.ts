import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { err, ErrorCode, ok } from '@/lib/api-response'
import { createAiProvider } from '@/lib/ai'
import { issueAnalysisRequestSchema } from '@/lib/validators/ai'
import { checkAndIncrementGuestUsage } from '@/lib/ai/guest-usage'
import { loadOnboardingProfile } from '@/lib/user/profile'
import { GUEST_ONBOARDING_PROFILE } from '@/constants/guest-profile'
import { getContributingGuide } from '@/lib/github/readme'

// x-real-ip 우선 — Vercel 주입값이며 x-forwarded-for와 달리 클라이언트가 조작할 수 없다
function extractClientIp(req: NextRequest): string {
    const realIp = req.headers.get('x-real-ip')
    if (realIp) return realIp.trim()
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return 'unknown'
}

export async function POST(req: NextRequest) {
    // GEMINI_API_KEY 미설정 시 기능 비활성화 — 게스트 카운트 소모 전에 차단
    if (!process.env.GEMINI_API_KEY) {
        return err('AI 분석 기능을 사용할 수 없습니다.', 503, ErrorCode.INTERNAL_ERROR)
    }

    const session = await auth()

    let accessToken: string

    if (!session) {
        const serverToken = process.env.GITHUB_TOKEN
        if (!serverToken) return err('Unauthorized', 401, ErrorCode.UNAUTHORIZED)

        const ip = extractClientIp(req)
        const { allowed } = await checkAndIncrementGuestUsage(ip)
        if (!allowed) {
            return err(
                '하루 무료 AI 분석 한도를 초과했습니다.',
                429,
                ErrorCode.RATE_LIMITED,
            )
        }
        accessToken = serverToken
    } else {
        const secureCookie = process.env.NODE_ENV === 'production'
        const token = await getToken({ req, secret: env.AUTH_SECRET, secureCookie })
        if (!token?.accessToken) return err('No access token', 401, ErrorCode.NO_ACCESS_TOKEN)
        accessToken = token.accessToken as string
    }

    const body = (await req.json().catch(() => null)) as unknown
    const parsed = issueAnalysisRequestSchema.safeParse(body)
    if (!parsed.success) {
        return err('Invalid request payload', 400, ErrorCode.INVALID_REQUEST)
    }

    // 로그인 사용자는 DB에서 프로필 로드, 게스트는 데모 프로필 사용
    const profile = session
        ? (await loadOnboardingProfile(session.user.id)) ?? GUEST_ONBOARDING_PROFILE
        : GUEST_ONBOARDING_PROFILE

    const [owner, repo] = parsed.data.repoFullName.split('/')
    const contributingGuide = await getContributingGuide(owner, repo, accessToken)

    try {
        const provider = createAiProvider()
        const analysis = await provider.analyzeIssue({
            ...parsed.data,
            userExperienceLevel: profile.experienceLevel ?? 'beginner',
            userPurpose: profile.purpose ?? 'portfolio',
            userWeeklyHours: profile.weeklyHours ?? 5,
            contributingGuide,
        })
        return ok(analysis)
    } catch (error) {
        console.error('[POST /api/ai/issue-analysis] AI 분석 실패:', error)
        return err('AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.', 500, ErrorCode.INTERNAL_ERROR)
    }
}
