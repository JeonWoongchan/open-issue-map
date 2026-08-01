'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
    { href: '/dashboard', label: '추천 이슈' },
    { href: '/issues', label: '이슈 탐색' },
] as const

export function PrimaryNav() {
    const pathname = usePathname()

    return (
        <>
            <nav className="hidden items-center gap-1 min-[551px]:flex">
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
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                    className="flex cursor-pointer items-center rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-[551px]:hidden"
                >
                    <ChevronDown className="size-4" aria-hidden="true" />
                    <span className="sr-only">페이지 메뉴 열기</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={10}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <DropdownMenuItem
                                key={item.href}
                                asChild
                                className={isActive ? 'bg-interactive-selected text-interactive-selected-foreground' : undefined}
                            >
                                <Link href={item.href}>{item.label}</Link>
                            </DropdownMenuItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
