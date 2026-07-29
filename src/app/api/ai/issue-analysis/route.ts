import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { err, ErrorCode, ok } from '@/lib/api-response'
import { createAiProvider } from '@/lib/ai'
import type { IssueAnalysis } from '@/lib/ai'
import { issueAnalysisRequestSchema } from '@/lib/validators/ai'
import { checkAndIncrementGuestUsage } from '@/lib/ai/guest-usage'
import { getCachedIssueGuide, saveIssueGuideCache } from '@/lib/ai/issue-guide-cache'
import { loadOnboardingProfile } from '@/lib/user/profile'
import { GUEST_ONBOARDING_PROFILE } from '@/constants/guest-profile'
import { getRepoReadme } from '@/lib/github/readme'
import { getContributionRules } from '@/lib/github/contribution-rules'

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

    if (!session) {
        const serverToken = process.env.GITHUB_TOKEN
        if (!serverToken) return err('Unauthorized', 401, ErrorCode.UNAUTHORIZED)
    } else {
        // README 조회는 이제 항상 서버 GITHUB_TOKEN을 쓰므로(getRepoReadme) 이 토큰 값 자체는
        // 아래에서 쓰이지 않는다 — 로그인 세션의 GitHub 연동 토큰이 아직 유효한지 확인하는
        // 게이트로만 남겨둔다(만료·연동 해제된 세션을 여기서 걸러낸다).
        const secureCookie = process.env.NODE_ENV === 'production'
        const token = await getToken({ req, secret: env.AUTH_SECRET, secureCookie })
        if (!token?.accessToken) return err('No access token', 401, ErrorCode.NO_ACCESS_TOKEN)
    }

    const body = (await req.json().catch(() => null)) as unknown
    const parsed = issueAnalysisRequestSchema.safeParse(body)
    if (!parsed.success) {
        return err('Invalid request payload', 400, ErrorCode.INVALID_REQUEST)
    }

    const { repoFullName, issueNumber, issueUpdatedAt } = parsed.data
    const cacheKey = { cacheUserId: session?.user.id ?? 'guest', repoFullName, issueNumber }

    // 캐시 히트면 게스트 한도를 전혀 건드리지 않고(실제 생성이 없었으므로) 바로 응답한다 —
    // 이슈 상세 페이지 진입 시 자동 실행되므로, 캐시가 없을 때만 게스트 한도가 소모돼야 한다.
    const cached = await getCachedIssueGuide(cacheKey, issueUpdatedAt)
    if (cached) {
        return ok(cached)
    }

    if (!session) {
        const ip = extractClientIp(req)
        const { allowed } = await checkAndIncrementGuestUsage(ip)
        if (!allowed) {
            return err(
                '오늘의 무료 AI 가이드를 모두 사용했습니다. 로그인하면 계속 이용할 수 있습니다.',
                429,
                ErrorCode.RATE_LIMITED,
            )
        }
    }

    const [owner, repo] = repoFullName.split('/')

    // DB 프로필 조회·README·기여 규칙 조회는 서로 독립적이므로 병렬 실행
    const [profile, readme, contributionRules] = await Promise.all([
        session
            ? loadOnboardingProfile(session.user.id).then((p) => p ?? GUEST_ONBOARDING_PROFILE)
            : Promise.resolve(GUEST_ONBOARDING_PROFILE),
        getRepoReadme(owner, repo),
        getContributionRules(owner, repo),
    ])

    try {
        const provider = createAiProvider()
        const aiResult = await provider.analyzeIssue({
            ...parsed.data,
            userExperienceLevel: profile.experienceLevel ?? 'beginner',
            userPurpose: profile.purpose ?? 'portfolio',
            userWeeklyHours: profile.weeklyHours ?? 5,
            readme,
            contributingGuideText: contributionRules.contributingGuideText,
        })
        // 파일 경로는 AI 판단이 아니라 우리 코드가 결정론적으로 확인한 값이라, AI 응답과
        // 분리해서 여기서 병합한다 — AI가 잘못된 경로를 지어낼 위험을 원천 차단한다.
        const analysis: IssueAnalysis = {
            ...aiResult,
            contributionRules: {
                contributingGuidePath: contributionRules.contributingGuidePath,
                pullRequestTemplatePath: contributionRules.pullRequestTemplatePath,
            },
        }
        await saveIssueGuideCache(cacheKey, issueUpdatedAt, analysis)
        return ok(analysis)
    } catch (error) {
        console.error('[POST /api/ai/issue-analysis] AI 분석 실패:', error)
        return err('AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.', 500, ErrorCode.INTERNAL_ERROR)
    }
}
