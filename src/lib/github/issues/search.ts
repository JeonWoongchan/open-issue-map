import { githubGraphQL, GitHubInvalidCursorError } from '@/lib/github/client'
import { GITHUB_SEARCH_TIMEOUT_MS, POPULAR_SORT_WINDOW_DAYS } from '@/constants/scoring-rules'
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
          timelineItems(first: 1, itemTypes: [CROSS_REFERENCED_EVENT]) {
            nodes { __typename }
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
    return githubGraphQL<SearchResult>(SEARCH_ISSUES_QUERY, { query, first, after }, accessToken, GITHUB_SEARCH_TIMEOUT_MS)
}

// GitHub 검색을 실행하고 결과를 IssueSearchResult 형태로 정리한다 — 쿼리 문자열만 다르게
// 조립해 넘기면 되므로 fetchCandidateIssues(온보딩 언어 후보 풀)와 이슈 탐색 전체 검색이
// 그대로 공유한다.
export async function fetchExploreIssues(
    query: string,
    accessToken: string,
    after: string | null,
    first: number,
): Promise<IssueSearchResult> {
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

    return {
        issues: dedupeIssues(result.search.nodes ?? []),
        endCursor: result.search.pageInfo.endCursor,
        hasMoreOnGithub: result.search.pageInfo.hasNextPage,
    }
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
    // star 기준 제외는 서버가 강제하지 않고 사용자가 UI에서 선택하는 minStars 필터(IssueFilters)에 맡긴다 —
    // 여기서 미리 걸러내면 캐시 풀에서 살아남는 후보가 크게 줄어 배치가 너무 빨리 소진된다.
    return fetchExploreIssues(query, accessToken, after, first)
}

const EXPLORE_DEFAULT_LABEL = 'help wanted'

export type ExploreQueryInput = {
    // 제출된 검색어 — 값이 있으면 기본 label:"help wanted" 제약을 걷어내고 GitHub 전체를 대상으로 한다.
    text: string
    // 언어 묶음 선택 결과(복수) — repeated language: qualifier는 OR로 해석된다.
    languages: string[]
    // 프리셋에서 온 label: qualifier. null이면 검색어 유무에 따라 기본값이 결정된다.
    githubLabel: string | null
    sort: 'popular' | 'latest'
}

// recommendations.ts(추천 캐러셀 "인기" 조건)도 같은 이유로 이 qualifier가 필요해 여기서 공유
// export한다 — 전체 이력 집계 비용이 큰 정렬(reactions-desc)에서 후보 풀을 최근 N일로 좁혀
// "Resource limits exceeded"를 완화하는 기법.
export function buildRecentWindowQualifier(days: number): string {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return `created:>=${sinceDate.toISOString().slice(0, 10)}`
}

// 이슈 탐색 페이지 전용 쿼리 빌더 — 온보딩 언어 제한 없이 GitHub 전체를 대상으로 한다.
// 검색어도 프리셋도 없으면 "help wanted" 라벨이 붙은 이슈를 기본값으로 보여준다(요구사항).
// 검색어가 있으면 그 기본 라벨 제약을 걷어내 자유 텍스트 검색이 전체 이슈를 대상으로 동작하게 한다.
export function buildExploreQuery({ text, languages, githubLabel, sort }: ExploreQueryInput): string {
    const trimmedText = text.trim()
    const label = githubLabel ?? (trimmedText ? null : EXPLORE_DEFAULT_LABEL)
    const labelQualifier = label ? `label:"${label}"` : ''
    const languageQualifiers = languages.map((lang) => `language:${lang}`).join(' ')
    // 인기순(reactions-desc)은 전체 이력을 집계해야 해서 "Resource limits exceeded"로 거부되기 쉽다.
    const sortQualifier = sort === 'popular'
        ? `sort:reactions-desc ${buildRecentWindowQualifier(POPULAR_SORT_WINDOW_DAYS)}`
        : 'sort:updated-desc'

    return `is:open is:issue ${labelQualifier} ${languageQualifiers} ${trimmedText} ${sortQualifier}`
        .trim()
        .replace(/\s+/g, ' ')
}

// 이슈 상세 페이지의 "이 저장소의 다른 이슈" 패널 전용
// 언어 기반 다중 저장소 검색과 달리 repo: qualifier로 저장소 하나만 좁혀서 조회한다.
export async function fetchRepoIssues(
    repoFullName: string,
    accessToken: string,
    first: number,
    excludeNumber?: number,
): Promise<RawIssue[]> {
    const query = `repo:${repoFullName} is:open is:issue label:"help wanted" sort:updated-desc`
    const result = await searchIssues(query, first, null, accessToken)
    return dedupeIssues(result.search.nodes ?? []).filter((issue) => issue.number !== excludeNumber)
}
