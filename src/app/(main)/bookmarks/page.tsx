import type { Metadata } from 'next'
import Link from 'next/link'
import { BookmarkList } from '@/components/bookmark/BookmarkList'
import { MainSectionShell } from '@/components/layout/MainSectionShell'
import { createPageMetadata } from '@/lib/metadata'

export const metadata: Metadata = createPageMetadata({
  title: '북마크',
  description: '저장해둔 GitHub 이슈를 한눈에 확인하고 관리합니다.',
  canonicalPath: '/bookmarks',
})

export default function BookmarksPage() {
  return (
    <MainSectionShell
      title="북마크"
      description="저장해둔 이슈를 다시 볼 수 있어요."
      actions={<Link href="/dashboard">추천 이슈 보러가기</Link>}
    >
      <BookmarkList />
    </MainSectionShell>
  )
}
