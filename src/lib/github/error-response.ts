import type { NextResponse } from 'next/server'

import { err, ErrorCode } from '@/lib/api-response'
import { GitHubNotFoundError, GitHubRateLimitError, GitHubUnauthorizedError } from '@/lib/github/client'
import { GitHubProfileError } from '@/lib/github/profile'

export const GITHUB_RATE_LIMITED_MESSAGE = 'GitHub API 요청 한도를 초과했습니다.'
export const GITHUB_UNAUTHORIZED_MESSAGE = 'GitHub 인증이 만료되었습니다. 다시 로그인해 주세요.'

type GitHubErrorResponseOptions = {
  fallbackMessage: string
  fallbackStatus?: number
  fallbackCode?: ErrorCode
  notFoundMessage?: string
  notFoundStatus?: number
  notFoundCode?: ErrorCode
}

export function getGitHubErrorResponse(
  error: unknown,
  {
    fallbackMessage,
    fallbackStatus = 502,
    fallbackCode = ErrorCode.GITHUB_ERROR,
    notFoundMessage,
    notFoundStatus = 404,
    notFoundCode = ErrorCode.INVALID_REPO,
  }: GitHubErrorResponseOptions
): NextResponse {
  if (error instanceof GitHubRateLimitError) {
    return err(GITHUB_RATE_LIMITED_MESSAGE, 429, ErrorCode.RATE_LIMITED)
  }

  if (error instanceof GitHubUnauthorizedError) {
    return err(GITHUB_UNAUTHORIZED_MESSAGE, 401, ErrorCode.UNAUTHORIZED)
  }

  if (error instanceof GitHubNotFoundError && notFoundMessage) {
    return err(notFoundMessage, notFoundStatus, notFoundCode)
  }

  if (error instanceof GitHubProfileError) {
    // error.message를 그대로 노출하지 않고 status만 참조해 정적 메시지 반환
    return err(fallbackMessage, error.status, ErrorCode.GITHUB_ERROR)
  }

  return err(fallbackMessage, fallbackStatus, fallbackCode)
}
