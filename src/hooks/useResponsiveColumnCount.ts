'use client'

import { useEffect, useState } from 'react'

export type ColumnBreakpoint = { minWidth: number; columns: number }

// IssueListContent/BookmarkListContent/PRHistoryContent/CardListSkeleton의 그리드와 반드시 일치해야 한다:
// grid-cols-1 sm:grid-cols-2(640px) lg:grid-cols-3(1024px) xl:grid-cols-4(1280px)
export const CARD_GRID_BREAKPOINTS: readonly ColumnBreakpoint[] = [
  { minWidth: 1280, columns: 4 },
  { minWidth: 1024, columns: 3 },
  { minWidth: 640, columns: 2 },
]

function resolveColumnCount(queries: readonly MediaQueryList[], breakpoints: readonly ColumnBreakpoint[]): number {
  const index = queries.findIndex((mq) => mq.matches)
  return index === -1 ? 1 : breakpoints[index].columns
}

// SSR에서는 1(모바일 기본값)을 반환하고, 클라이언트 마운트 후 실제 값으로 업데이트한다.
// breakpoints는 호출하는 쪽의 실제 그리드 정의와 맞춰서 넘긴다 — 그리드마다 최대 열 수가 다르기 때문.
export function useResponsiveColumnCount(
  breakpoints: readonly ColumnBreakpoint[] = CARD_GRID_BREAKPOINTS
): number {
  const [columnCount, setColumnCount] = useState(1)

  useEffect(() => {
    const queries = breakpoints.map((bp) => window.matchMedia(`(min-width: ${bp.minWidth}px)`))
    const update = () => setColumnCount(resolveColumnCount(queries, breakpoints))
    update()
    queries.forEach((mq) => mq.addEventListener('change', update))
    return () => queries.forEach((mq) => mq.removeEventListener('change', update))
  }, [breakpoints])

  return columnCount
}
