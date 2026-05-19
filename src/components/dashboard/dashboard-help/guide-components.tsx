import { Badge } from '@/components/ui/badge'
import { ReactNode } from 'react'

export function HelpSection({
    number,
    title,
    badge,
    description,
    children,
}: {
    number: number
    title: string
    badge?: string
    description?: string
    children?: ReactNode
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-interactive-selected text-[10px] font-semibold text-interactive-selected-foreground">
                    {number}
                </span>
                <span className="text-sm font-semibold text-foreground">{title}</span>
                {badge ? (
                    <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                        {badge}
                    </Badge>
                ) : null}
            </div>
            {description ? (
                <p className="text-xs leading-5 text-muted-foreground">{description}</p>
            ) : null}
            {children}
        </div>
    )
}

export function HelpTableRow({ label, description }: { label: string; description: string }) {
    return (
        <tr className="border-t border-border/60 first:border-t-0">
            <td className="w-1/3 px-3 py-2 font-medium text-foreground">{label}</td>
            <td className="px-3 py-2 text-muted-foreground">{description}</td>
        </tr>
    )
}

export function HelpDataTable({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-xs">
                <tbody>{children}</tbody>
            </table>
        </div>
    )
}
