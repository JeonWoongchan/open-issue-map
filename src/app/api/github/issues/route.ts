import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { err, ErrorCode, ok } from '@/lib/api-response'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { EXPLORE_INITIAL_BATCH } from '@/constants/scoring-rules'
import { GITHUB_RATE_LIMITED_MESSAGE, GITHUB_UNAUTHORIZED_MESSAGE } from '@/lib/github/error-response'
import { parseIssueFilters } from '@/lib/github/issues/filters'
import { fetchIssueExplorePage } from '@/lib/github/issues/service'
import { loadOnboardingProfile, type OnboardingProfile } from '@/lib/user/profile'
import { GUEST_ONBOARDING_PROFILE } from '@/constants/guest-profile'
import type { IssueSort } from '@/types/issue'

function parseSort(value: string | null): IssueSort {
    return value === 'popular' ? 'popular' : 'latest'
}

// 음수/비정수/NaN 등 신뢰할 수 없는 offset은 배치 시작(0)으로 취급한다.
function parseOffset(value: string | null): number {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}

export async function GET(req: NextRequest) {
    const session = await auth()

    let userId: string | null
    let accessToken: string
    let profile: OnboardingProfile

    if (!session) {
        // 게스트 모드: 서버 GitHub 토큰과 기본 온보딩 프로필로 이슈 조회
        const serverToken = process.env.GITHUB_TOKEN
        if (!serverToken) return err('Unauthorized', 401, ErrorCode.UNAUTHORIZED)
        userId = null
        accessToken = serverToken
        profile = GUEST_ONBOARDING_PROFILE
    } else {
        // 로그인 사용자: JWT에서 액세스 토큰 추출 후 개인 온보딩 프로필 적용(채점용 — 조회 자체는 더 이상 언어로 제한하지 않음)
        const secureCookie = process.env.NODE_ENV === 'production'
        const token = await getToken({ req, secret: env.AUTH_SECRET, secureCookie })
        if (!token?.accessToken) return err('No access token', 401, ErrorCode.NO_ACCESS_TOKEN)

        userId = session.user.id
        accessToken = token.accessToken
        const loaded = await loadOnboardingProfile(userId)
        if (!loaded) return err('Onboarding not complete', 400, ErrorCode.ONBOARDING_REQUIRED)
        profile = loaded
    }

    try {
        const { searchParams } = new URL(req.url)
        const filters = parseIssueFilters(searchParams)

        const result = await fetchIssueExplorePage({
            userId,
            accessToken,
            profile,
            filters,
            query: searchParams.get('q') ?? '',
            sort: parseSort(searchParams.get('sort')),
            githubLabel: searchParams.get('githubLabel'),
            languageGroup: searchParams.get('languageGroup'),
            offset: parseOffset(searchParams.get('offset')),
            batch: searchParams.get('batch') ?? EXPLORE_INITIAL_BATCH,
        })

        if ('error' in result) {
            if (result.error === 'rate_limited') return err(GITHUB_RATE_LIMITED_MESSAGE, 429, ErrorCode.RATE_LIMITED)
            if (result.error === 'unauthorized') return err(GITHUB_UNAUTHORIZED_MESSAGE, 401, ErrorCode.UNAUTHORIZED)
            return err('이슈 목록을 불러오지 못했습니다.', 502, ErrorCode.GITHUB_ERROR)  // result.error === 'fetch_failed'
        }

        return ok(result)
    } catch (error) {
        console.error('[GET /api/github/issues] 이슈 목록 조회 실패:', error)
        return err('Failed to fetch issues', 500, ErrorCode.INTERNAL_ERROR)
    }
}
