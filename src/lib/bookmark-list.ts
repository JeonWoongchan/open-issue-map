import { countUserBookmarks, listUserBookmarks } from '@/lib/bookmarks'
import type { Bookmark } from '@/types/bookmark'
import type { IssueCardItem } from '@/types/issue'

type GetBookmarkListInput = {
  userId: string
  limit: number
  offset: number
}

// 북마크 저장 시점 스냅샷을 카드 아이템 형식으로 그대로 변환한다 — GitHub 재조회 없음.
function toIssueCardItem(bookmark: Bookmark): IssueCardItem {
  return {
    number: bookmark.issueNumber,
    title: bookmark.issueTitle,
    url: bookmark.issueUrl,
    repoFullName: bookmark.repoFullName,
    repoUrl: bookmark.repoUrl,
    language: bookmark.language,
    stargazerCount: bookmark.stargazerCount,
    labels: bookmark.labels,
    commentCount: bookmark.commentCount,
    createdAt: bookmark.issueCreatedAt,
    updatedAt: bookmark.issueUpdatedAt,
    body: bookmark.issueBody,
    score: bookmark.score,
    difficultyLevel: bookmark.difficultyLevel,
    contributionType: bookmark.contributionType,
    competitionLevel: bookmark.competitionLevel,
    hasPR: bookmark.hasPR,
    repoActivityLevel: bookmark.repoActivityLevel,
    isBookmarked: true,
  }
}

export async function getBookmarkList({ userId, limit, offset }: GetBookmarkListInput) {
  const [bookmarks, total] = await Promise.all([
    listUserBookmarks(userId, { limit, offset }),
    countUserBookmarks(userId),
  ])

  const issues = bookmarks.map(toIssueCardItem)

  return {
    issues,
    pageInfo: {
      limit,
      offset,
      total,
      hasMore: offset + issues.length < total,
    },
  }
}
