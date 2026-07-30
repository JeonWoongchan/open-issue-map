'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignInButton } from '@/components/shared/SignInButton'
import { signInWithGitHub } from '@/lib/auth-actions'
import { SITE_TITLE } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { LANDING_FIRST_SECTION_ID } from './landing-constants'

// IntersectionObserver 하나로 판단한다 — 스크롤마다 rect를 다시 재는 방식보다 가볍다.
export function LandingHeader() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const target = document.getElementById(LANDING_FIRST_SECTION_ID)
        if (!target) return

        const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
            threshold: 0.5,
        })
        io.observe(target)

        return () => io.disconnect()
    }, [])

    const pillClass = cn(
        'fixed top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-background/80 shadow-lg backdrop-blur-md transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'pointer-events-none -translate-y-3 opacity-0'
    )

    return (
        <>
            <Link href="/" className={cn(pillClass, 'left-5 px-5 py-2.5 text-sm font-semibold tracking-tight text-interactive-action')}>
                {SITE_TITLE}
            </Link>
            <div className={cn(pillClass, 'right-5 gap-1.5 p-3 rounded-lg')}>
                <form action={signInWithGitHub}>
                    <SignInButton size="sm" />
                </form>
                <Button asChild variant="interactive" size="sm">
                    <Link href="/dashboard">추천 이슈 미리보기</Link>
                </Button>
            </div>
        </>
    )
}
