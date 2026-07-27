import { githubGraphQL, GitHubInvalidCursorError } from '@/lib/github/client'
import type { RawIssue } from '@/types/issue'

const SEARCH_ISSUES_QUERY = `
  query SearchIssues($query: String!, $first: Int!, $after: String) {
    search(query: $query, type: ISSUE, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Issue {
          number
          title
          url
          body
          createdAt
          updatedAt
          comments { totalCount }
          reactions { totalCount }
          labels(first: 10) {
            nodes { name }
          }
          repository {
            nameWithOwner
            url
            primaryLanguage { name }
            stargazerCount
            pushedAt
          }
          timelineItems(first: 5, itemTypes: [CROSS_REFERENCED_EVENT]) {
            nodes {
              __typename
              ... on CrossReferencedEvent {
                source {
                  __typename
                }
              }
            }
          }
        }
      }
    }
  }
`

interface PageInfo {
    hasNextPage: boolean
    endCursor: string | null
}

interface SearchResult {
    search: {
        pageInfo: PageInfo
        nodes: RawIssue[]
    }
}

export type IssueSearchResult = {
    issues: RawIssue[]
    endCursor: string | null
    hasMoreOnGithub: boolean
}

// 여러 언어를 하나의 쿼리에 담는다 — GitHub search는 OR 키워드를 지원하지 않지만
// 같은 qualifier(language:)를 여러 번 나열하면 자동으로 OR로 해석한다.
// 언어 개수와 무관하게 항상 요청 1개로 고정되어 GitHub secondary rate limit 위험을 줄인다.
function buildIssueQuery(languages: string[], sort: string, extraQualifiers: string): string {
    const languageQualifiers = languages.map((lang) => `language:${lang}`).join(' ')
    const extra = extraQualifiers ? `${extraQualifiers} ` : ''
    return `is:open is:issue label:"help wanted" ${languageQualifiers} ${extra}sort:${sort}`.trim().replace(/\s+/g, ' ')
}

// URL 기준 중복 이슈 제거
export function dedupeIssues(issues: RawIssue[]): RawIssue[] {
    const seen = new Set<string>()
    return issues.filter((issue) => {
        if (seen.has(issue.url)) return false
        seen.add(issue.url)
        return true
    })
}

async function searchIssues(query: string, first: number, after: string | null, accessToken: string): Promise<SearchResult> {
    return githubGraphQL<SearchResult>(SEARCH_ISSUES_QUERY, { query, first, after }, accessToken)
}

// 지정한 언어들의 GitHub 후보 이슈를 한 번의 쿼리로 조회한다.
// rate limit/인증 오류는 그대로 throw해 호출부(service.ts)가 분류하도록 한다 —
// Promise.allSettled로 감싸지 않으므로 unstable_cache가 실패를 성공으로 착각해 캐싱하는 일이 없다.
export async function fetchCandidateIssues(
    languages: string[],
    accessToken: string,
    after: string | null,
    first: number,
    sort = 'updated-desc',
    extraQualifiers = ''
): Promise<IssueSearchResult> {
    if (languages.length === 0) {
        return { issues: [], endCursor: null, hasMoreOnGithub: false }
    }

    const query = buildIssueQuery(languages, sort, extraQualifiers)

    let result: SearchResult
    try {
        result = await searchIssues(query, first, after, accessToken)
    } catch (error) {
        // 정렬 기준이 실시간으로 바뀌는 결과셋(예: updated-desc)이면 예전에 발급된 커서가
        // 나중엔 무효화될 수 있다 — 이 경우 첫 페이지부터 다시 조회해 캐싱 목적을 유지한다.
        if (error instanceof GitHubInvalidCursorError && after !== null) {
            result = await searchIssues(query, first, null, accessToken)
        } else {
            throw error
        }
    }

    // star 기준 제외는 서버가 강제하지 않고 사용자가 UI에서 선택하는 minStars 필터(IssueFilters)에 맡긴다 —
    // 여기서 미리 걸러내면 캐시 풀에서 살아남는 후보가 크게 줄어 배치가 너무 빨리 소진된다.
    const issues = dedupeIssues(result.search.nodes ?? [])

    return {
        issues,
        endCursor: result.search.pageInfo.endCursor,
        hasMoreOnGithub: result.search.pageInfo.hasNextPage,
    }
}
