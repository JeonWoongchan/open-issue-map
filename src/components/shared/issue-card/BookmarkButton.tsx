'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverClose, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { IssueCardItem } from '@/types/issue'

type BookmarkButtonProps = {
    issue: IssueCardItem
    isBookmarkPending: boolean
    onToggleBookmarkAction: (issue: IssueCardItem) => Promise<void>
}

export function BookmarkButton({ issue, isBookmarkPending, onToggleBookmarkAction }: BookmarkButtonProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    function handleClick() {
        if (issue.isBookmarked) {
            setIsConfirmOpen(true)
        } else {
            void onToggleBookmarkAction(issue)
        }
    }

    function handleConfirm() {
        setIsConfirmOpen(false)
        void onToggleBookmarkAction(issue)
    }

    return (
        // PopoverAnchor로 버튼을 위치 기준점으로만 사용하고,
        // 클릭 동작(팝오버 열기 vs 직접 토글)은 handleClick이 독립 제어.
        <Popover open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <PopoverAnchor asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={isBookmarkPending}
                    aria-label={issue.isBookmarked ? '북마크 제거' : '북마크 추가'}
                    aria-pressed={issue.isBookmarked ?? false}
                    className={cn(
                        'text-muted-foreground hover:bg-interactive-hover hover:text-bookmark-action-hover',
                        issue.isBookmarked ? 'text-bookmark-action' : null
                    )}
                    onClick={handleClick}
                >
                    <Bookmark className={cn('size-5 transition-colors', issue.isBookmarked ? 'fill-current' : null)} />
                </Button>
            </PopoverAnchor>

            <PopoverContent className="w-52" align="end" side="top">
                <p className="mb-3 text-sm font-medium">북마크를 제거할까요?</p>
                <div className="flex justify-end gap-2">
                    <PopoverClose asChild>
                        <Button type="button" variant="outline" size="sm">
                            취소
                        </Button>
                    </PopoverClose>
                    <Button type="button" variant="default" size="sm" onClick={handleConfirm}>
                        제거
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
