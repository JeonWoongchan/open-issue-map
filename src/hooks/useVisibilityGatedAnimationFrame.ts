'use client'

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

type Options = {
    // false면 루프 자체를 시작하지 않는다 — 예: prefers-reduced-motion일 때 호출부가 넘긴다.
    enabled?: boolean
}

// onFrame은 매 렌더마다 새 함수를 넘겨도 안전하다(최신 참조를 ref로 추적해 effect를 재구독하지 않는다).
export function useVisibilityGatedAnimationFrame(
    targetRef: RefObject<Element | null>,
    onFrame: (time: number) => void,
    { enabled = true }: Options = {}
): void {
    const onFrameRef = useRef(onFrame)
    onFrameRef.current = onFrame

    useEffect(() => {
        const target = targetRef.current
        if (!enabled || !target) return

        let frameId = 0
        let isVisible = true

        function loop(time: number) {
            if (!isVisible) return
            onFrameRef.current(time)
            frameId = requestAnimationFrame(loop)
        }

        frameId = requestAnimationFrame(loop)

        const io = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting
                if (isVisible) {
                    cancelAnimationFrame(frameId)
                    frameId = requestAnimationFrame(loop)
                }
            },
            { threshold: 0 }
        )
        io.observe(target)

        return () => {
            cancelAnimationFrame(frameId)
            io.disconnect()
        }
    }, [targetRef, enabled])
}
