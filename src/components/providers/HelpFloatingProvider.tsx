'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type HelpFloatingContextValue = {
    // 현재 페이지가 등록해둔 "도움말 열기" 콜백. 페이지가 없으면(온보딩·프로필 등) null이라
    // 플로팅 버튼이 아예 렌더링되지 않는다.
    openHandler: (() => void) | null
    // 페이지의 도움말 다이얼로그가 마운트될 때 자신의 openDialog를 등록하고, 언마운트될 때
    // 반환된 함수로 해제한다. 페이지 이동 시 자연스럽게 다음 페이지의 핸들러로 교체된다.
    registerOpenHandler: (handler: () => void) => () => void
}

const HelpFloatingContext = createContext<HelpFloatingContextValue | null>(null)

export function HelpFloatingProvider({ children }: { children: ReactNode }) {
    const [openHandler, setOpenHandler] = useState<(() => void) | null>(null)

    // useState에 함수를 직접 넣으면 updater로 오인되므로 () => handler로 감싼다.
    const registerOpenHandler = useCallback((handler: () => void) => {
        setOpenHandler(() => handler)
        return () => {
            setOpenHandler((current) => (current === handler ? null : current))
        }
    }, [])

    return (
        <HelpFloatingContext.Provider value={{ openHandler, registerOpenHandler }}>
            {children}
        </HelpFloatingContext.Provider>
    )
}

export function useHelpFloatingContext(): HelpFloatingContextValue {
    const ctx = useContext(HelpFloatingContext)
    if (!ctx) {
        throw new Error('useHelpFloatingContext는 HelpFloatingProvider 안에서만 사용할 수 있습니다.')
    }
    return ctx
}
