'use client'

import { useEffect, useRef, useState } from 'react'

// 서버 사이드 페이지네이션용 sentinel — 뷰포트 진입 시 onEnter 호출
// 콜백 ref(state) 방식으로 sentinel 요소가 조건부 렌더링될 때도 observer가 정확히 등록/해제된다
export function useScrollSentinel(onEnter: () => void): (el: HTMLDivElement | null) => void {
    const callbackRef = useRef(onEnter)
    callbackRef.current = onEnter

    const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!sentinelEl) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) callbackRef.current()
            },
            { rootMargin: '100px' },
        )

        observer.observe(sentinelEl)
        return () => observer.disconnect()
    }, [sentinelEl])

    return setSentinelEl
}
