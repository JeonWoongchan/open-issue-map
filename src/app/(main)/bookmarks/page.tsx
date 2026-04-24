import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { MainSectionShell } from '@/components/layout/MainSectionShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BookmarksPage() {
  return (
    <MainSectionShell
      title="북마크"
      description="저장한 이슈를 다시 보고 진행 상태와 PR 링크를 관리할 수 있습니다."
      actions={
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-fit border-interactive-selected-border text-interactive-action-hover hover:bg-interactive-hover"
        >
          <Link href="/dashboard">추천 이슈 보러가기</Link>
        </Button>
      }
    >
      <Card size="sm" className="border border-dashed border-interactive-selected-border/70 bg-card/70">
        <CardHeader>
          <div className="flex items-center gap-2 text-interactive-action-hover">
            <Bookmark className="size-4" />
            <CardTitle className="text-base">북마크 목록 준비 중</CardTitle>
          </div>
          <CardDescription>
            다음 단계에서 이 영역에 저장한 이슈 목록, 상태 필터, 진행 상태 변경 UI를 붙일 예정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>우선 페이지 구조와 진입 동선부터 고정했습니다.</p>
          <p>북마크 기능 구현 시 이 영역에 리스트와 빈 상태 컴포넌트를 분리해서 넣는 구성이 적절합니다.</p>
        </CardContent>
      </Card>
    </MainSectionShell>
  )
}
