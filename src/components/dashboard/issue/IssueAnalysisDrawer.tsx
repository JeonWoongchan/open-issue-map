'use client'

import { X, RotateCcw, Loader2, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useIssueAnalysis } from '@/hooks/useIssueAnalysis'
import { cn } from '@/lib/utils'
import type { IssueCardItem } from '@/types/issue'
import type { IssueAnalysis, AnalysisDifficulty } from '@/lib/ai'

const DIFFICULTY_STYLE: Record<AnalysisDifficulty, string> = {
    '쉬움': 'border-status-success-border text-status-success-foreground bg-status-success',
    '보통': 'border-status-warning-border text-status-warning-foreground bg-status-warning',
    '어려움': 'border-status-danger-border text-status-danger-foreground bg-status-danger',
}

type AnalysisQueryState = {
    data: IssueAnalysis | undefined
    isPending: boolean
    isError: boolean
    error: unknown
    refetch: () => void
}

type AnalysisContentProps = {
    issue: IssueCardItem | null
    onClose: () => void
}

function AnalysisHeader({ issue, onClose }: AnalysisContentProps) {
    return (
        <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">AI 작업 가이드</p>
                <p className="truncate text-sm font-medium">{issue?.title ?? ''}</p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={onClose}
                aria-label="닫기"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}

function AnalysisLoading() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">이슈를 분석하는 중...</p>
        </div>
    )
}

function AnalysisError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                다시 시도
            </Button>
        </div>
    )
}

function AnalysisDisclaimer() {
    return (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-status-warning-border bg-status-warning px-3 py-2.5 text-xs text-status-warning-foreground">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>AI 분석은 참고용입니다. 실제 코드와 다를 수 있으므로 기여 전 반드시 저장소를 직접 확인하세요.</p>
        </div>
    )
}

function AnalysisResult({ data }: { data: IssueAnalysis }) {
    return (
        <div className="flex flex-col gap-5 overflow-y-auto p-4 text-sm">
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">예상 난이도</span>
                <Badge variant="outline" className={cn('rounded-md text-xs', DIFFICULTY_STYLE[data.difficulty])}>
                    {data.difficulty}
                </Badge>
            </div>

            <section className="flex flex-col gap-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">예상 작업 범위</h3>
                <p className="text-sm leading-relaxed">{data.scope}</p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">필요한 개념</h3>
                <div className="flex flex-wrap gap-1.5">
                    {data.concepts.map((concept) => (
                        <Badge key={concept} variant="secondary" className="rounded-md text-xs font-normal">
                            {concept}
                        </Badge>
                    ))}
                </div>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">먼저 봐야 할 부분</h3>
                <ul className="flex flex-col gap-1">
                    {data.startingPoints.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-interactive-action" />
                            {point}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">주의할 점</h3>
                <ul className="flex flex-col gap-1">
                    {data.cautions.map((caution) => (
                        <li key={caution} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-status-warning-foreground" />
                            {caution}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}

function AnalysisBody({ isPending, isError, error, data, refetch }: AnalysisQueryState) {
    if (isPending) return <AnalysisLoading />
    if (isError) return (
        <AnalysisError
            message={error instanceof Error ? error.message : 'AI 분석에 실패했습니다.'}
            onRetry={refetch}
        />
    )
    if (data) return (
        <>
            <AnalysisDisclaimer />
            <AnalysisResult data={data} />
        </>
    )
    return null
}

type IssueAnalysisDrawerProps = {
    issue: IssueCardItem | null
    open: boolean
    onOpenChangeAction: (open: boolean) => void
}

export function IssueAnalysisDrawer({ issue, open, onOpenChangeAction }: IssueAnalysisDrawerProps) {
    const isDesktop = useIsDesktop()
    // 드로어가 닫혀도 언마운트되지 않도록 훅을 최상위에서 호출 — 재오픈 시 캐시 데이터 즉시 표시
    const queryState = useIssueAnalysis(issue)

    function handleClose() {
      onOpenChangeAction(false)
    }

    const bodyProps: AnalysisQueryState = {
        data: queryState.data,
        isPending: queryState.isPending,
        isError: queryState.isError,
        error: queryState.error,
        refetch: () => void queryState.refetch(),
    }

    // 데스크톱: 우하단 채팅창 스타일 패널
    if (isDesktop) {
        return (
            <div
                className={cn(
                    'fixed bottom-4 right-4 z-50 flex w-[420px] flex-col rounded-2xl border border-border bg-background shadow-2xl',
                    'max-h-[70vh] overflow-hidden',
                    'transition-all duration-300 ease-out',
                    open
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-4 opacity-0',
                )}
            >
                <AnalysisHeader issue={issue} onClose={handleClose} />
                <AnalysisBody {...bodyProps} />
            </div>
        )
    }

    // 모바일: 하단에서 올라오는 드로어
    return (
        <Drawer open={open} onOpenChange={onOpenChangeAction}>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>{issue?.title ?? 'AI 작업 가이드'}</DrawerTitle>
                </DrawerHeader>
                <AnalysisHeader issue={issue} onClose={handleClose} />
                <AnalysisBody {...bodyProps} />
            </DrawerContent>
        </Drawer>
    )
}
