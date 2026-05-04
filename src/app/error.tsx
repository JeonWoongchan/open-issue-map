'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

type ErrorProps = {
    error: Error & { digest?: string }
    reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('[GlobalError]', error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold text-foreground">서비스에 일시적인 오류가 발생했습니다.</p>
                <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
            </div>
            <Button variant="outline" onClick={reset}>
                다시 시도
            </Button>
        </div>
    )
}
