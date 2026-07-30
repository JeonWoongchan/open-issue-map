'use client'

import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHelpFloatingContext } from '@/components/providers/HelpFloatingProvider'

// 화면 우측 하단에 고정되는 공통 도움말 버튼 — 페이지별로 흩어져 있던 도움말 트리거를
// 하나로 통일한다. 현재 페이지가 도움말을 등록해두지 않았으면(useRegisterFloatingHelp
// 미호출) openHandler가 null이라 아무것도 렌더링하지 않는다.
export function HelpFloatingButton() {
    const { openHandler } = useHelpFloatingContext()

    if (!openHandler) return null

    return (
        <Button
            type="button"
            size="icon-lg"
            aria-label="도움말"
            onClick={openHandler}
            className="fixed bottom-5 right-5 z-40 size-12 rounded-full shadow-lg"
        >
            <CircleHelp className="size-5" />
        </Button>
    )
}
