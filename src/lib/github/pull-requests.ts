import { githubGraphQL } from '@/lib/github/client'
import type { RawPullRequest, PullRequestItem, PullRequestState, PullRequestSummary } from '@/types/pull-request'

const VIEWER_PULL_REQUESTS_QUERY = `
  query ViewerPullRequests($first: Int!, $after: String, $states: [PullRequestState!]) {
    viewer {
      pullRequests(
        first: $first
        after: $after
        states: $states
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          title
          url
          state
          createdAt
          mergedAt
          closedAt
          additions
          deletions
          changedFiles
          comments { totalCount }
          reviews { totalCount }
          labels(first: 5) {
            nodes { name }
          }
          commits { totalCount }
          repository {
            nameWithOwner
            url
            stargazerCount
            primaryLanguage { name }
          }
        }
      }
    }
  }
`

interface ViewerPRsResult {
    viewer: {
        pullRequests: {
            totalCount: number
            pageInfo: {
                hasNextPage: boolean
                endCursor: string | null
            }
            nodes: RawPullRequest[]
        }
    }
}

// 본인 소유 레포에 올린 PR 제외 — 오픈소스 기여 목록만 남김
export function excludeOwnRepoPRs(items: PullRequestItem[], viewerLogin: string): PullRequestItem[] {
    if (!viewerLogin) return items
    return items.filter((item) => item.repoFullName.split('/')[0] !== viewerLogin)
}

// GraphQL 원시 응답을 클라이언트용 평탄 구조로 변환
function toPullRequestItem(raw: RawPullRequest): PullRequestItem {
    return {
        title: raw.title,
        url: raw.url,
        state: raw.state,
        createdAt: raw.createdAt,
        mergedAt: raw.mergedAt,
        closedAt: raw.closedAt,
        additions: raw.additions,
        deletions: raw.deletions,
        changedFiles: raw.changedFiles,
        commentCount: raw.comments.totalCount,
        reviewCount: raw.reviews.totalCount,
        commitCount: raw.commits.totalCount,
        labels: raw.labels.nodes.map((l) => l.name),
        repoFullName: raw.repository.nameWithOwner,
        repoUrl: raw.repository.url,
        stargazerCount: raw.repository.stargazerCount,
        language: raw.repository.primaryLanguage?.name ?? null,
    }
}

// PR 목록 전체 기준 요약 통계 계산
export function computeSummary(items: PullRequestItem[]): PullRequestSummary {
    return {
        totalCount: items.length,
        mergedCount: items.filter((pr) => pr.state === 'MERGED').length,
        openCount: items.filter((pr) => pr.state === 'OPEN').length,
        closedCount: items.filter((pr) => pr.state === 'CLOSED').length,
        totalAdditions: items.reduce((sum, pr) => sum + pr.additions, 0),
        totalDeletions: items.reduce((sum, pr) => sum + pr.deletions, 0),
    }
}

// GitHub GraphQL에서 PR 100개 단위로 한 페이지 조회
async function fetchPullRequestPage(
    accessToken: string,
    after: string | null,
    states: PullRequestState[] | null,
): Promise<ViewerPRsResult['viewer']['pullRequests']> {
    const data = await githubGraphQL<ViewerPRsResult>(
        VIEWER_PULL_REQUESTS_QUERY,
        { first: 100, after, states },
        accessToken,
    )
    return data.viewer.pullRequests
}

export type FetchPullRequestsParams = {
    accessToken: string
    viewerLogin?: string
    states?: PullRequestState[] | null
}

export type FetchPullRequestsResult = {
    items: PullRequestItem[]
    summary: PullRequestSummary
}

// 100개씩 최대 MAX_PR_FETCH_PAGES 페이지까지 조회 — PR 1,000개 초과 시 GitHub API 연속 호출 방지
const MAX_PR_FETCH_PAGES = 10

// GitHub GraphQL은 states: null 시 MERGED를 반환하지 않으므로 전체 조회 시 명시적으로 지정
const ALL_PR_STATES: PullRequestState[] = ['OPEN', 'MERGED', 'CLOSED']

export async function fetchViewerPullRequests({
    accessToken,
    viewerLogin = '',
    states = null,
}: FetchPullRequestsParams): Promise<FetchPullRequestsResult> {
    let after: string | null = null
    let hasNextPage = true
    let pageCount = 0
    const allItems: PullRequestItem[] = []

    const effectiveStates = states ?? ALL_PR_STATES

    while (hasNextPage && pageCount < MAX_PR_FETCH_PAGES) {
        const connection = await fetchPullRequestPage(accessToken, after, effectiveStates)
        allItems.push(...excludeOwnRepoPRs(connection.nodes.map(toPullRequestItem), viewerLogin))
        hasNextPage = connection.pageInfo.hasNextPage
        after = connection.pageInfo.endCursor
        pageCount++
    }

    return { items: allItems, summary: computeSummary(allItems) }
}
