import { githubGraphQL, GitHubNotFoundError } from '@/lib/github/client'
import type { RawIssue } from '@/types/issue'

// search.ts의 SEARCH_ISSUES_QUERY와 동일한 필드 선택을 단일 이슈 조회용으로 감싼다 —
// 카드 목록과 상세 페이지가 같은 RawIssue 모양을 그대로 재사용하기 위함.
const ISSUE_DETAIL_QUERY = `
  query IssueDetail($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
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
          }
        }
      }
    }
  }
`

interface IssueDetailResult {
  repository: { issue: RawIssue | null } | null
}

// 이슈가 없거나(삭제됨) 저장소가 없으면 null을 반환한다 — 호출부가 notFound()로 처리한다.
export async function fetchIssueDetail(
  owner: string,
  repo: string,
  number: number,
  accessToken: string,
): Promise<RawIssue | null> {
  try {
    const result = await githubGraphQL<IssueDetailResult>(
      ISSUE_DETAIL_QUERY,
      { owner, repo, number },
      accessToken,
    )
    return result.repository?.issue ?? null
  } catch (error) {
    if (error instanceof GitHubNotFoundError) {
      return null
    }
    throw error
  }
}
