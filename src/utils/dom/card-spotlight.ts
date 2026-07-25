import type { MouseEvent } from 'react'

// 라이브러리 없이 직접 구현한 이유: 마우스 좌표를 CSS 변수(--mx, --my) 2개에 기록하는 게
// 전부라 Framer Motion 같은 애니메이션 라이브러리를 새로 추가할 만큼 복잡하지 않다.
// React state를 거치지 않고 DOM에 직접 쓰기 때문에, 카드가 몇 개든 마우스가 올라간
// 카드 1개만 매 mousemove마다 갱신되고 나머지는 전혀 리렌더되지 않는다.
// 추후에 다른 요소에 이 효과 적용할 경우 공통 유틸로 분리
export function updateSpotlightPosition(event: MouseEvent<HTMLDivElement>): void {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`)
}
