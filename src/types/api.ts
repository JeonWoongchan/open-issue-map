import type { IssueCardItem, ScoredIssue } from './issue'
import type { PullRequestItem, PullRequestSummary } from './pull-request'

// 서버 api-response.ts의 ok(), err() 응답 형태에 대응하는 클라이언트 타입
export type ApiResponse<T> =
    | { ok: true; data: T }
    | { ok: false; error?: { message?: string; code?: string } }

// GET /api/github/issues 응답 data 타입.
// batch: 이번 응답이 속한 배치의 시작 커서(EXPLORE_INITIAL_BATCH 또는 GitHub 커서).
// nextBatch: 이 배치(foreground+background)를 다 썼고 GitHub에 더 있을 때만 채워지는 다음 배치 커서.
//   null이면 같은 배치 안에서 offset만 늘려 계속 요청한다.
export type IssueListPage = {
    issues: ScoredIssue[]
    hasMore: boolean
    offset: number
    batch: string
    nextBatch: string | null
}

// GET /api/github/pull-requests 응답 data 타입
export type PRListPage = {
    items: PullRequestItem[]
    summary: PullRequestSummary
    total: number
    hasMore: boolean
    offset: number
}

// GET /api/bookmarks 응답 data 타입
export type BookmarkPageInfo = {
    limit: number
    offset: number
    total: number
    hasMore: boolean
}

export type BookmarkListPage = {
    issues: IssueCardItem[]
    pageInfo: BookmarkPageInfo
}
