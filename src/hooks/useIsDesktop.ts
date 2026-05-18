'use client'

import { useEffect, useState } from 'react'

// SSR에서는 false(모바일 기본값)를 반환하고, 클라이언트 마운트 후 실제 값으로 업데이트한다.
// 사용자 인터랙션으로 열리는 컴포넌트에서만 사용하므로 hydration 불일치 위험이 없다.
export function useIsDesktop(breakpoint = 768): boolean {
    const [isDesktop, setIsDesktop] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia(`(min-width: ${breakpoint}px)`)
        setIsDesktop(mq.matches)

        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [breakpoint])

    return isDesktop
}
