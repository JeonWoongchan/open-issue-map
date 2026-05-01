import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { HelpGuideInteractionProps } from '@/types/help'

type HelpHotspotProps<TGuideId extends string> = HelpGuideInteractionProps<TGuideId> & {
  guideId: TGuideId
  className?: string
  children: ReactNode
}

// 데모 카드 내 개별 요소를 감싸는 인터랙션 래퍼.
// div 대신 button으로 구현해 키보드 포커스(Tab) 이벤트를 지원.
// HelpGuideList와 같은 activeGuideId를 공유해 좌측 카드 ↔ 우측 설명 양방향 강조 동기화.
export function HelpHotspot<TGuideId extends string>({
  guideId,
  activeGuideId,
  onActivateGuide,
  onClearGuide,
  className,
  children,
}: HelpHotspotProps<TGuideId>) {
  const isActive = guideId === activeGuideId

  return (
    <button
      type="button"
      onMouseEnter={() => onActivateGuide(guideId)}
      onMouseLeave={onClearGuide}
      onFocus={() => onActivateGuide(guideId)}
      onBlur={onClearGuide}
      className={cn(
        'inline-flex w-fit text-left outline-none transition-all',
        'focus-visible:ring-2 focus-visible:ring-interactive-selected-ring/60',
        className,
        isActive && 'scale-[1.03] bg-interactive-selected/30 shadow-lg'
      )}
    >
      {children}
    </button>
  )
}
