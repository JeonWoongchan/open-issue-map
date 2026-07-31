import { GITHUB_API_TIMEOUT_MS } from '@/constants/scoring-rules'

export class GitHubRateLimitError extends Error {
  constructor() {
    super('RATE_LIMITED')
    this.name = 'GitHubRateLimitError'
  }
}

export class GitHubUnauthorizedError extends Error {
  constructor() {
    super('UNAUTHORIZED')
    this.name = 'GitHubUnauthorizedError'
  }
}

export class GitHubNotFoundError extends Error {
  constructor() {
    super('NOT_FOUND')
    this.name = 'GitHubNotFoundError'
  }
}

// search 커넥션의 after 커서가 만료/무효화된 경우 — sort:updated-desc 등 실시간으로 바뀌는
// 결과셋에서 GitHub이 예전 커서를 거부할 때 발생. 재시도 시 첫 페이지부터 다시 조회해야 한다.
export class GitHubInvalidCursorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GitHubInvalidCursorError'
  }
}

export async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string,
  timeoutMs: number = GITHUB_API_TIMEOUT_MS
): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new GitHubUnauthorizedError()
    }
    // primary rate limit(x-ratelimit-remaining=0)과 secondary rate limit(짧은 시간 내 동시/반복 요청 시
    // 403 + retry-after, x-ratelimit-remaining 헤더 자체가 없음) 둘 다 동일하게 처리한다.
    if (res.status === 403 && (res.headers.get('x-ratelimit-remaining') === '0' || res.headers.get('retry-after'))) {
      throw new GitHubRateLimitError()
    }
    throw new Error(`GitHub GraphQL error: ${res.status}`)
  }

  const json = await res.json()

  // GraphQL 에러 타입별 구분 — 새 타입 추가 시 case만 추가
  if (json.errors?.length > 0) {
    const firstError = json.errors[0]

    switch (firstError.type) {
    case 'RATE_LIMITED':            throw new GitHubRateLimitError()
    case 'NOT_FOUND':               throw new GitHubNotFoundError()
    case 'UNAUTHORIZED':            throw new GitHubUnauthorizedError()
    case 'INVALID_CURSOR_ARGUMENTS': throw new GitHubInvalidCursorError(firstError.message ?? 'Invalid cursor')
    default:                        throw new Error(firstError.message ?? 'GraphQL error')
    }
  }

  return json.data as T
}
