import type { CSSProperties } from 'react'
import { EXPLORE_PRESETS, type ExplorePreset } from '@/constants/explore-presets'
import { ExplorePresetIcon } from './ExplorePresetIcon'

// 프리셋마다 다른 색을 입힌다. 초보환영/문서/버그는 globals.css의 --preset-icon-* 토큰을
// 쓴다(status-*-foreground는 배지 배경 위 텍스트용이라 다크 모드에서 채도가 거의 0으로
// 떨어져 아이콘 단독으로는 안 보인다 — 아이콘 전용으로 라이트/다크를 따로 튜닝한 토큰).
const PRESET_ICON_COLORS: Record<string, string> = {
  'good-first-issue': 'var(--preset-icon-success)',
  documentation: 'var(--preset-icon-doc)',
  bug: 'var(--preset-icon-danger)',
  enhancement: 'var(--interactive-action)',
  popular: 'var(--bookmark-action)',
}

type IssueSearchPresetsProps = {
  // 프리셋 아이콘은 한 번에 하나만 활성화된다(라디오 버튼처럼 배타적으로 동작).
  activeKey: string | null
  // 이미 활성인 프리셋을 다시 클릭하는 것(끄기)도 그대로 이 프리셋으로 전달한다 —
  // 어떤 필드를 되돌려야 할지는 프리셋마다 다르므로 토글 판단은 호출부(IssueList)가 한다.
  onSelectAction: (preset: ExplorePreset) => void
}

// 검색창 위 "자주 찾는 조건" — 박스(카드) 없이 아이콘+텍스트만 세로로 쌓고, 가로 중앙 정렬한다.
// 좁은 화면에서는 스크롤 대신 줄바꿈(flex-wrap)으로 처리한다.
// 호버 반응은 배경색 대신 아이콘이 살짝 우측으로 회전하는 것으로 표현한다.
export function IssueSearchPresets({ activeKey, onSelectAction }: IssueSearchPresetsProps) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-1 gap-y-2">
      {EXPLORE_PRESETS.map((preset) => {
        const isActive = activeKey === preset.key
        return (
          <button
            key={preset.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectAction(preset)}
            className="group flex w-20 cursor-pointer flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center"
            style={{ '--icon-color': PRESET_ICON_COLORS[preset.key] } as CSSProperties}
          >
            <span style={{ color: 'var(--icon-color)' } as CSSProperties}>
              <ExplorePresetIcon
                icon={preset.icon}
                className="size-7 shrink-0 transition-transform duration-200 ease-out group-hover:rotate-12"
              />
            </span>
            <span
              className={
                'text-xs font-medium leading-tight ' +
                (isActive ? 'text-interactive-action' : 'text-foreground')
              }
            >
              {preset.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
