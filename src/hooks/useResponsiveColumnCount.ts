'use client'

import { useEffect, useState } from 'react'

// IssueListContent/BookmarkListContent/CardListSkeleton의 그리드 브레이크포인트와 반드시 일치해야 한다:
// grid-cols-1 sm:grid-cols-2(640px) lg:grid-cols-3(1024px) xl:grid-cols-4(1280px)
const BREAKPOINTS = [
  { minWidth: 1280, columns: 4 },
  { minWidth: 1024, columns: 3 },
  { minWidth: 640, columns: 2 },
] as const

function resolveColumnCount(): number {
  const matched = BREAKPOINTS.find((bp) => window.matchMedia(`(min-width: ${bp.minWidth}px)`).matches)
  return matched?.columns ?? 1
}

// SSR에서는 1(모바일 기본값)을 반환하고, 클라이언트 마운트 후 실제 값으로 업데이트한다.
export function useResponsiveColumnCount(): number {
  const [columnCount, setColumnCount] = useState(1)

  useEffect(() => {
    const queries = BREAKPOINTS.map((bp) => window.matchMedia(`(min-width: ${bp.minWidth}px)`))
    const update = () => setColumnCount(resolveColumnCount())
    update()
    queries.forEach((mq) => mq.addEventListener('change', update))
    return () => queries.forEach((mq) => mq.removeEventListener('change', update))
  }, [])

  return columnCount
}
