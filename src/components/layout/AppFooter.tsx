'use client'

import {Check, Copy, Mail} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { REPORT_EMAIL } from '@/constants/app'

const COPIED_RESET_DELAY_MS = 1800

export function AppFooter() {
    const [isCopied, setIsCopied] = useState(false)

    useEffect(() => {
        if (!isCopied) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            setIsCopied(false)
        }, COPIED_RESET_DELAY_MS)

        return () => window.clearTimeout(timeoutId)
    }, [isCopied])

    async function handleCopyEmail() {
        await navigator.clipboard.writeText(REPORT_EMAIL)
        setIsCopied(true)
    }

    const Icon = isCopied ? Check : Copy

    return (
        <footer className="mt-8 border-t border-border/60 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-interactive-action">Open Issue Map</p>
                    <p className="text-xs text-muted-foreground">
                        &copy; 2026 Open Issue Map. All rights reserved.
                    </p>
                </div>
                <div className="flex items-start sm:items-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            void handleCopyEmail()
                        }}
                        className="w-fit px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-interactive-action-hover"
                        aria-label={
                            isCopied ? '문의 이메일 주소가 복사됨' : `문의 이메일 주소 복사: ${REPORT_EMAIL}`
                        }
                    >
                        <Mail className="size-3"/>
                        {REPORT_EMAIL}
                        <Icon className="size-3.5" aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </footer>
    )
}
