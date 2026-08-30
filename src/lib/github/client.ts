import { GITHUB_API_TIMEOUT_MS } from '@/constants/scoring-rules'

export type GitHubErrorKind =
  | 'rate_limit'
  | 'unauthorized'
  | 'not_found'
  | 'invalid_cursor'
  | 'resource_limit'
  | 'timeout'
  | 'network'
  | 'http'
  | 'graphql'

export type GitHubGraphQLErrorInfo = {
  type?: string
  path?: Array<string | number>
}

export type GitHubErrorDetails = {
  upstreamStatus?: number
  githubRequestId?: string
  retryAfter?: string
  rateLimit?: {
    limit?: string
    remaining?: string
    used?: string
    reset?: string
  }
  graphqlErrors?: GitHubGraphQLErrorInfo[]
  partialData?: boolean
}

export type GitHubRateLimitScope = 'primary' | 'secondary' | 'unknown'

const DEFAULT_SECONDARY_RETRY_AFTER_SECONDS = 60
const MAX_RETRY_AFTER_SECONDS = 60 * 60

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly kind: GitHubErrorKind,
    public readonly details: GitHubErrorDetails = {},
  ) {
    super(message)
    this.name = 'GitHubApiError'
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(details: GitHubErrorDetails = {}) {
    super('RATE_LIMITED', 'rate_limit', details)
    this.name = 'GitHubRateLimitError'
  }
}

export class GitHubUnauthorizedError extends GitHubApiError {
  constructor(details: GitHubErrorDetails = {}) {
    super('UNAUTHORIZED', 'unauthorized', details)
    this.name = 'GitHubUnauthorizedError'
  }
}

export class GitHubNotFoundError extends GitHubApiError {
  constructor(details: GitHubErrorDetails = {}) {
    super('NOT_FOUND', 'not_found', details)
    this.name = 'GitHubNotFoundError'
  }
}

// search 커넥션의 after 커서가 만료/무효화된 경우 — sort:updated-desc 등 실시간으로 바뀌는
// 결과셋에서 GitHub이 예전 커서를 거부할 때 발생. 재시도 시 첫 페이지부터 다시 조회해야 한다.
export class GitHubInvalidCursorError extends GitHubApiError {
  constructor(message: string, details: GitHubErrorDetails = {}) {
    super(message, 'invalid_cursor', details)
    this.name = 'GitHubInvalidCursorError'
  }
}

export class GitHubResourceLimitError extends GitHubApiError {
  constructor(details: GitHubErrorDetails = {}) {
    super('RESOURCE_LIMIT_EXCEEDED', 'resource_limit', details)
    this.name = 'GitHubResourceLimitError'
  }
}

export class GitHubTimeoutError extends GitHubApiError {
  constructor(details: GitHubErrorDetails = {}) {
    super('TIMEOUT', 'timeout', details)
    this.name = 'GitHubTimeoutError'
  }
}

export class GitHubNetworkError extends GitHubApiError {
  constructor(details: GitHubErrorDetails = {}) {
    super('NETWORK_ERROR', 'network', details)
    this.name = 'GitHubNetworkError'
  }
}

export class GitHubHttpError extends GitHubApiError {
  constructor(status: number, details: GitHubErrorDetails = {}) {
    super(`GitHub GraphQL error: ${status}`, 'http', details)
    this.name = 'GitHubHttpError'
  }
}

export class GitHubGraphQLError extends GitHubApiError {
  constructor(details: GitHubErrorDetails = {}) {
    super('GraphQL error', 'graphql', details)
    this.name = 'GitHubGraphQLError'
  }
}

export function getGitHubRateLimitScope(error: GitHubRateLimitError): GitHubRateLimitScope {
  if (error.details.rateLimit?.remaining === '0') return 'primary'
  if (error.details.retryAfter) return 'secondary'
  if (error.details.rateLimit?.remaining !== undefined) return 'secondary'
  return 'unknown'
}

function clampRetryAfter(seconds: number): number {
  return Math.max(1, Math.min(MAX_RETRY_AFTER_SECONDS, Math.ceil(seconds)))
}

// GitHub 권고 순서대로 Retry-After, primary reset, secondary 기본 60초를 사용한다.
// 외부 응답 헤더로 전달되는 값이므로 비정상/과도한 값은 1시간 범위로 제한한다.
export function getGitHubRetryAfterSeconds(
  error: GitHubRateLimitError,
  nowMs: number = Date.now(),
): number {
  const retryAfter = Number(error.details.retryAfter)
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return clampRetryAfter(retryAfter)
  }

  if (error.details.rateLimit?.remaining === '0') {
    const resetAtSeconds = Number(error.details.rateLimit.reset)
    if (Number.isFinite(resetAtSeconds) && resetAtSeconds > 0) {
      return clampRetryAfter(resetAtSeconds - nowMs / 1000)
    }
  }

  return DEFAULT_SECONDARY_RETRY_AFTER_SECONDS
}

type GraphQLErrorPayload = {
  type?: unknown
  message?: unknown
  path?: unknown
}

function readHeader(res: Response, name: string): string | undefined {
  return res.headers.get(name) ?? undefined
}

function buildErrorDetails(
  res: Response,
  graphqlErrors?: GitHubGraphQLErrorInfo[],
  partialData?: boolean,
): GitHubErrorDetails {
  const rateLimit = {
    limit: readHeader(res, 'x-ratelimit-limit'),
    remaining: readHeader(res, 'x-ratelimit-remaining'),
    used: readHeader(res, 'x-ratelimit-used'),
    reset: readHeader(res, 'x-ratelimit-reset'),
  }
  const hasRateLimitHeader = Object.values(rateLimit).some((value) => value !== undefined)

  return {
    upstreamStatus: res.status,
    githubRequestId: readHeader(res, 'x-github-request-id'),
    retryAfter: readHeader(res, 'retry-after'),
    rateLimit: hasRateLimitHeader ? rateLimit : undefined,
    graphqlErrors,
    partialData,
  }
}

function normalizeGraphQLErrors(errors: GraphQLErrorPayload[]): GitHubGraphQLErrorInfo[] {
  return errors.map((error) => ({
    type: typeof error.type === 'string' ? error.type : undefined,
    path: Array.isArray(error.path)
      ? error.path.filter((part): part is string | number => typeof part === 'string' || typeof part === 'number')
      : undefined,
  }))
}

function errorType(error: GraphQLErrorPayload): string | undefined {
  return typeof error.type === 'string' ? error.type : undefined
}

function errorMessage(error: GraphQLErrorPayload): string | undefined {
  return typeof error.message === 'string' ? error.message : undefined
}

function isResourceLimitError(error: GraphQLErrorPayload): boolean {
  const type = errorType(error)
  const message = errorMessage(error)
  return type === 'RESOURCE_LIMITS_EXCEEDED'
    || type === 'RESOURCE_LIMIT_EXCEEDED'
    || message?.includes('Resource limits for this query exceeded') === true
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.name === 'TimeoutError' || error.name === 'AbortError'
}

// 로그 호출부가 raw Error를 그대로 출력하지 않고, GitHub가 허용한 진단 필드만 남기게 한다.
export function getGitHubErrorLogFields(error: unknown): Record<string, unknown> {
  if (!(error instanceof GitHubApiError)) {
    return { errorKind: 'internal' }
  }

  return {
    errorKind: error.kind,
    rateLimitScope: error instanceof GitHubRateLimitError
      ? getGitHubRateLimitScope(error)
      : undefined,
    upstreamStatus: error.details.upstreamStatus,
    githubRequestId: error.details.githubRequestId,
    retryAfter: error.details.retryAfter,
    rateLimit: error.details.rateLimit,
    githubErrorTypes: error.details.graphqlErrors?.map((item) => item.type).filter(Boolean),
    githubErrorPaths: error.details.graphqlErrors?.map((item) => item.path).filter(Boolean),
    partialData: error.details.partialData,
  }
}

export async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string,
  timeoutMs: number = GITHUB_API_TIMEOUT_MS
): Promise<T> {
  let res: Response
  try {
    res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new GitHubTimeoutError()
    }
    throw new GitHubNetworkError()
  }

  const responseDetails = buildErrorDetails(res)

  if (!res.ok) {
    if (res.status === 401) {
      throw new GitHubUnauthorizedError(responseDetails)
    }
    // primary rate limit(x-ratelimit-remaining=0)과 secondary rate limit(retry-after) 및
    // GitHub가 명시적으로 반환하는 429를 같은 종류로 정규화한다.
    if (res.status === 429 || (res.status === 403
      && (res.headers.get('x-ratelimit-remaining') === '0' || res.headers.get('retry-after')))) {
      throw new GitHubRateLimitError(responseDetails)
    }
    throw new GitHubHttpError(res.status, responseDetails)
  }

  const json = await res.json() as {
    data?: T
    errors?: GraphQLErrorPayload[]
  }

  if (Array.isArray(json.errors) && json.errors.length > 0) {
    const errors = json.errors
    const details = buildErrorDetails(res, normalizeGraphQLErrors(errors), json.data !== undefined)

    if (errors.some(isResourceLimitError)) {
      throw new GitHubResourceLimitError(details)
    }
    if (errors.some((error) => errorType(error) === 'RATE_LIMITED')) {
      throw new GitHubRateLimitError(details)
    }
    if (errors.some((error) => errorType(error) === 'NOT_FOUND')) {
      throw new GitHubNotFoundError(details)
    }
    if (errors.some((error) => errorType(error) === 'UNAUTHORIZED')) {
      throw new GitHubUnauthorizedError(details)
    }

    const invalidCursorError = errors.find((error) => errorType(error) === 'INVALID_CURSOR_ARGUMENTS')
    if (invalidCursorError) {
      throw new GitHubInvalidCursorError(errorMessage(invalidCursorError) ?? 'Invalid cursor', details)
    }

    throw new GitHubGraphQLError(details)
  }

  return json.data as T
}
