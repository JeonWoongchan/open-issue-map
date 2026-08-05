import type { ComponentType, ReactNode } from 'react'
import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type DetailPanelProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  children: ReactNode
  // 헤더 우측에 놓는 보조 액션(예: AI 가이드 패널의 "기여 방법 안내" 트리거) — 필요할 때만 전달한다.
  action?: ReactNode
}

// 상세 페이지의 모든 섹션(저장소 개요, 기여 규칙, 점수 브레이크다운 등)이 공유하는 패널 셸 —
// 아이콘 + uppercase 라벨 헤더 바는 RecommendationRailShell의 eyebrow 스타일과 동일한 톤을 쓴다.
export function DetailPanel({ icon: Icon, label, children, action }: DetailPanelProps) {
  return (
    <Card className="min-w-0 border border-border py-4">
      <CardContent className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold tracking-wide text-interactive-action uppercase">
            <Icon className="size-3.5 shrink-0" />
            {label}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        <Separator />
        {children}
      </CardContent>
    </Card>
  )
}

// 개요·AI 가이드 하단의 참고 문구가 같은 모바일 shrink/wrapping 규칙을 공유하도록 한곳에서 관리한다.
export function DetailPanelNotice({ children }: { children: ReactNode }) {
  return (
    <p className="flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words break-keep text-pretty">{children}</span>
    </p>
  )
}
