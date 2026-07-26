'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
    { href: '/dashboard', label: '추천 이슈' },
    { href: '/issues', label: '이슈 탐색' },
] as const

export function PrimaryNav() {
    const pathname = usePathname()

    return (
        <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-interactive-selected text-interactive-selected-foreground'
                                : 'text-muted-foreground hover:bg-interactive-hover hover:text-foreground'
                        )}
                    >
                        {item.label}
                    </Link>
                )
            })}
        </nav>
    )
}
