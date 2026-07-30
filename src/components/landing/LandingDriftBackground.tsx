'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { IssueScoreBadge } from '@/components/shared/issue-card/IssueScoreBadge'
import { useVisibilityGatedAnimationFrame } from '@/hooks/useVisibilityGatedAnimationFrame'
import { cn } from '@/lib/utils'

type MockIssueCard = {
    id: string
    repo: string
    title: string
    language: string
    tag: string
    stars: string
    comments: string
    score: number
    className: string
}

const MOCK_CARDS: MockIssueCard[] = [
    {
        id: 'c1', repo: 'facebook/react', title: 'Fix stale closure in useEffect cleanup warning',
        language: 'TypeScript', tag: 'good first issue', stars: '231k', comments: '3', score: 85,
        className: 'left-[4%] top-[8%]',
    },
    {
        id: 'c2', repo: 'vitejs/vite', title: 'Improve HMR error overlay for CSS modules',
        language: 'JavaScript', tag: 'documentation', stars: '68k', comments: '1', score: 74,
        className: 'right-[6%] top-[4%]',
    },
    {
        id: 'c3', repo: 'rust-lang/cargo', title: 'Add helpful hint for workspace resolution',
        language: 'Rust', tag: '', stars: '12k', comments: '5', score: 91,
        className: 'left-[8%] top-[62%]',
    },
    {
        id: 'c4', repo: 'golang/go', title: 'context: clarify cancellation docs',
        language: 'Go', tag: 'good second issue', stars: '124k', comments: '2', score: 82,
        className: 'right-[5%] top-[68%]',
    },
    {
        id: 'c5', repo: 'supabase/supabase', title: 'Docs: clarify RLS policy example',
        language: 'TypeScript', tag: '', stars: '74k', comments: '0', score: 88,
        className: 'left-[42%] top-[36%] opacity-70 max-md:hidden',
    },
]

const DRIFTERS = MOCK_CARDS.map((card, i) => ({
    id: card.id,
    base: i % 2 === 0 ? -7 : 6,
    amp: 9 + (i % 3) * 2,
    speed: 0.0003 + (i % 4) * 0.00002,
    phase: i * 1.4,
}))

export function LandingDriftBackground() {
    const rootRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const mouseRef = useRef({ x: 0, y: 0 })
    const [reduceMotion, setReduceMotion] = useState(false)

    useEffect(() => {
        setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }, [])

    // 레이어가 실제로 보일 때만 mousemove를 구독한다 — 안 그러면 화면 밖에서도 계속 갱신된다.
    useEffect(() => {
        if (reduceMotion) return
        const root = rootRef.current
        if (!root) return

        function handleMouseMove(e: MouseEvent) {
            mouseRef.current = {
                x: e.clientX / window.innerWidth - 0.5,
                y: e.clientY / window.innerHeight - 0.5,
            }
        }

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    window.addEventListener('mousemove', handleMouseMove, { passive: true })
                } else {
                    window.removeEventListener('mousemove', handleMouseMove)
                }
            },
            { threshold: 0 }
        )
        io.observe(root)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            io.disconnect()
        }
    }, [reduceMotion])

    useVisibilityGatedAnimationFrame(
        rootRef,
        (time) => {
            const { x: mx, y: my } = mouseRef.current
            for (const d of DRIFTERS) {
                const el = cardRefs.current[d.id]
                if (!el) continue
                const s = d.speed * time + d.phase
                const yFloat = Math.sin(s) * d.amp
                const xFloat = Math.cos(s * 0.8) * (d.amp * 0.6)
                const rot = d.base + Math.sin(s * 0.6) * 2.2
                el.style.transform = `translate(${xFloat + mx * 10}px, ${yFloat + my * 10}px) rotate(${rot}deg)`
            }
        },
        { enabled: !reduceMotion }
    )

    return (
        <div ref={rootRef} className="relative h-full w-full overflow-hidden" aria-hidden="true">
            {MOCK_CARDS.map((card) => (
                <div
                    key={card.id}
                    ref={(el) => { cardRefs.current[card.id] = el }}
                    className={cn(
                        'absolute w-52 rounded-xl border border-border bg-card p-4 shadow-xl will-change-transform',
                        card.className
                    )}
                >
                    <p className="truncate text-[10px] text-muted-foreground">{card.repo}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-card-foreground">
                        {card.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                        <Badge
                            variant="outline"
                            className="rounded-md border-interactive-selected-border bg-interactive-selected px-1.5 py-0.5 text-[9px] text-interactive-selected-foreground"
                        >
                            {card.language}
                        </Badge>
                        {card.tag ? (
                            <Badge variant="outline" className="rounded-md px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                {card.tag}
                            </Badge>
                        ) : null}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[9.5px] text-muted-foreground">
                        <span>{'★'} {card.stars}</span>
                        <span>{'💬'} {card.comments}</span>
                    </div>
                    {card.score > 0 ? (
                        <IssueScoreBadge score={card.score} size="sm" className="absolute right-3 top-3 origin-top-right scale-50" />
                    ) : null}
                </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/60 to-background/35" />
        </div>
    )
}
