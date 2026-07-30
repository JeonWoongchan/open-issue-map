import type { ReactNode } from 'react'

// 대시보드/메인 레이아웃이 공유하는 페이지 폭 — CARD_GRID_BREAKPOINTS(useResponsiveColumnCount)의
// xl:1280px 4열 기준이 이 폭(max-w-7xl=1280px)을 전제로 만들어져 있어, 페이지마다 폭이 다르면
// 같은 뷰포트에서도 카드 그리드가 다르게 좁아 보인다. 모든 최상위 페이지가 이 컴포넌트를 거치게 해
// 그 전제를 어긋나지 않게 유지한다.
export function PageContainer({ children }: { children: ReactNode }) {
    return <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
}
