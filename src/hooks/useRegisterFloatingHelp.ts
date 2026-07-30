'use client'

import { useEffect } from 'react'
import { useHelpFloatingContext } from '@/components/providers/HelpFloatingProvider'

// 페이지의 도움말 다이얼로그가 마운트되는 동안, 화면 우측 하단 공통 "?" 버튼이
// 이 페이지의 openDialog를 호출하도록 등록한다. 언마운트(페이지 이동) 시 자동 해제된다.
export function useRegisterFloatingHelp(openDialog: () => void): void {
    const { registerOpenHandler } = useHelpFloatingContext()

    useEffect(() => {
        return registerOpenHandler(openDialog)
    }, [registerOpenHandler, openDialog])
}
