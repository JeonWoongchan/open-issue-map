import type { ComponentType, ReactNode } from 'react'
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
    <Card className="border border-border py-4">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-interactive-action uppercase">
            <Icon className="size-3.5" />
            {label}
          </div>
          {action}
        </div>
        <Separator />
        {children}
      </CardContent>
    </Card>
  )
}
