"use client"

import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type ToastVariant = 'default' | 'success' | 'destructive'

const VARIANT_CONFIG: Record<ToastVariant, { icon: LucideIcon; iconClassName: string }> = {
    default: { icon: Info, iconClassName: 'text-muted-foreground' },
    success: { icon: CheckCircle2, iconClassName: 'text-status-success-foreground' },
    destructive: { icon: AlertCircle, iconClassName: 'text-status-danger-foreground' },
}

export function Toaster() {
    const { toasts } = useToast()

    return (
        <ToastProvider>
            {toasts.map(({ id, title, description, action, variant, ...props }) => {
                const { icon: Icon, iconClassName } = VARIANT_CONFIG[variant ?? 'default']
                return (
                    <Toast key={id} variant={variant} {...props}>
                        <div className="flex items-start gap-3">
                            <Icon className={cn('mt-px size-4 shrink-0', iconClassName)} />
                            <div className="grid gap-0.5">
                                {title ? <ToastTitle>{title}</ToastTitle> : null}
                                {description ? (
                                    <ToastDescription>{description}</ToastDescription>
                                ) : null}
                            </div>
                        </div>
                        {action}
                        <ToastClose />
                    </Toast>
                )
            })}
            <ToastViewport />
        </ToastProvider>
    )
}
