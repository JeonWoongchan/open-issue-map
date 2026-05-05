import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CenteredPanelProps = {
    children: ReactNode
    footer?: ReactNode
    className?: string
    contentClassName?: string
}

export function CenteredPanel({ children, footer, className, contentClassName }: CenteredPanelProps) {
    return (
        <div className={cn('flex min-h-screen items-center justify-center bg-muted px-4 py-8', className)}>
            <div className="flex w-full max-w-lg flex-col gap-2">
                <div
                    className={cn(
                        'rounded-2xl border border-border bg-card p-8 shadow-sm',
                        contentClassName
                    )}
                >
                    {children}
                </div>
                {footer ? footer : null}
            </div>
        </div>
    )
}
