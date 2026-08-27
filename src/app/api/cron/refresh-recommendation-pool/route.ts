import { NextRequest } from 'next/server'
import { POPULAR_LANGUAGES } from '@/constants/contribution-levels'
import { RECOMMENDATION_CONDITIONS, type RecommendationCondition } from '@/constants/recommendation'
import { refreshCandidatePool } from '@/lib/github/issues/recommendations'
import {
  getGitHubErrorLogFields,
  GitHubApiError,
  GitHubRateLimitError,
  GitHubResourceLimitError,
  GitHubTimeoutError,
  GitHubUnauthorizedError,
} from '@/lib/github/client'
import { ErrorCode, err, ok } from '@/lib/api-response'

// 언어 하나만 처리해도 페이지 3개를 순차로 넘겨야 해서 기본 10초 제한에 걸린다.
// 실측상 popular 조건은 최대 20초 안팎이 걸려 여유를 두고 45초로 설정한다.
export const maxDuration = 45

function isRecommendationCondition(value: string | null): value is RecommendationCondition {
  return (RECOMMENDATION_CONDITIONS as readonly string[]).includes(value ?? '')
}

// GitHub Actions 스케줄 워크플로 전용 엔드포인트 — CRON_SECRET을 아는 호출자만 실행 가능하다.
// 언어 하나 + 조건 하나의 후보 풀만 갱신한다(13개 언어를 한 호출에서 다 처리하면 Vercel Hobby의
// 함수 실행 시간 상한(60초)을 실측상 넘겨서, 언어별 팬아웃은 호출부인 워크플로의 matrix가 담당한다).
// 요청 경로(대시보드 렌더링)는 이 라우트를 절대 호출하지 않는다.
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return err('Unauthorized', 401, ErrorCode.UNAUTHORIZED)
  }

  const condition = req.nextUrl.searchParams.get('condition')
  if (!isRecommendationCondition(condition)) {
    return err('Invalid or missing condition', 400, ErrorCode.INVALID_REQUEST)
  }

  const language = req.nextUrl.searchParams.get('language')
  if (!language || !(POPULAR_LANGUAGES as readonly string[]).includes(language)) {
    return err('Invalid or missing language', 400, ErrorCode.INVALID_REQUEST)
  }

  const accessToken = process.env.GITHUB_TOKEN
  if (!accessToken) {
    return err('GITHUB_TOKEN not configured', 500, ErrorCode.INTERNAL_ERROR)
  }

  try {
    await refreshCandidatePool(language, condition, accessToken)
    return ok({ condition, language })
  } catch (error) {
    console.error(JSON.stringify({
      event: 'recommendation_pool_refresh',
      status: 'failed',
      phase: error instanceof GitHubApiError ? 'fetch' : 'refresh',
      condition,
      language,
      ...getGitHubErrorLogFields(error),
    }))

    if (error instanceof GitHubResourceLimitError) {
      return err('GitHub query resource limit exceeded', 503, ErrorCode.GITHUB_RESOURCE_LIMIT)
    }
    if (error instanceof GitHubRateLimitError) {
      return err('GitHub rate limit exceeded', 429, ErrorCode.RATE_LIMITED)
    }
    if (error instanceof GitHubTimeoutError) {
      return err('GitHub request timed out', 504, ErrorCode.GITHUB_TIMEOUT)
    }
    if (error instanceof GitHubUnauthorizedError) {
      return err('GitHub server token authentication failed', 502, ErrorCode.GITHUB_AUTH_ERROR)
    }
    if (error instanceof GitHubApiError) {
      return err('GitHub request failed', 502, ErrorCode.GITHUB_ERROR)
    }
    return err('refresh failed', 500, ErrorCode.INTERNAL_ERROR)
  }
}
