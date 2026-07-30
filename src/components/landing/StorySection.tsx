'use client'

import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { cn } from '@/lib/utils'

export function RevealBlock({ children, className }: { children: ReactNode; className?: string }) {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })
    return (
        <div
            ref={ref}
            className={cn(
                'transition-all duration-700 ease-out motion-reduce:transition-none',
                inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                className
            )}
        >
            {children}
        </div>
    )
}

const TONE_CLASS = {
    amber: 'border border-brand-subtle-border bg-[linear-gradient(150deg,color-mix(in_oklab,var(--interactive-action)_20%,var(--background)),var(--background)_65%)]',
    neutral: 'border border-border bg-card',
    success: 'border border-status-success-border bg-[linear-gradient(150deg,color-mix(in_oklab,var(--status-success)_55%,var(--background)),var(--background)_65%)]',
} as const

const FADE_CLASS = {
    amber: 'from-background',
    neutral: 'from-card',
    success: 'from-background',
} as const

// 높이를 고정해두고, 안에 들어가는 실제 컴포넌트가 넘치면 잘라내는 대신 페이드로 흐린다.
export function ImageBox({
    children,
    tone = 'neutral',
    fadeDirection = 'bottom',
    className,
}: {
    children: ReactNode
    tone?: keyof typeof TONE_CLASS
    fadeDirection?: 'bottom' | 'right'
    className?: string
}) {
    const isRightFade = fadeDirection === 'right'
    return (
        <div
            className={cn(
                'relative flex h-[380px] w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-black/30 sm:h-[440px]',
                isRightFade ? 'items-center justify-start py-6 pl-6 sm:py-8 sm:pl-8' : 'items-start justify-center p-6 sm:p-8',
                TONE_CLASS[tone],
                className
            )}
        >
            {children}
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute',
                    isRightFade
                        ? 'inset-y-0 right-0 w-24 bg-gradient-to-l to-transparent sm:w-32'
                        : 'inset-x-0 bottom-0 h-28 bg-gradient-to-t to-transparent sm:h-36',
                    FADE_CLASS[tone]
                )}
            />
        </div>
    )
}

export type StorySectionData = {
    headingId: string
    // LandingHeader가 스크롤 위치를 감지할 대상 섹션이면 지정한다(현재는 첫 섹션만).
    sectionId?: string
    heading: string
    body: string
    visual: ReactNode
    reverseOnDesktop?: boolean
}

const BASE_GRID_CLASS = 'mx-auto grid w-full max-w-7xl items-center gap-10'
export const STORY_SECTION_CLASS = 'flex min-h-[60svh] items-center px-4 py-14'

export function StorySection({
    headingId,
    sectionId,
    heading,
    body,
    visual,
    reverseOnDesktop = false,
}: StorySectionData) {
    return (
        <section id={sectionId} aria-labelledby={headingId} className={STORY_SECTION_CLASS}>
            <div
                className={cn(
                    BASE_GRID_CLASS,
                    reverseOnDesktop ? 'lg:grid-cols-[0.85fr_1.15fr]' : 'lg:grid-cols-[1.15fr_0.85fr]'
                )}
            >
                {/* min-w-0 없으면 줄바꿈 없는 콘텐츠(캐러셀 등)가 그리드 트랙을 내용 너비만큼 늘려버린다. */}
                <RevealBlock className={cn('min-w-0', reverseOnDesktop && 'lg:order-2')}>{visual}</RevealBlock>
                <RevealBlock className={cn('min-w-0', reverseOnDesktop && 'lg:order-1')}>
                    <h2 id={headingId} className="whitespace-pre-line text-balance text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                        {heading}
                    </h2>
                    <p className="mt-3 max-w-md whitespace-pre-line text-pretty text-[15px] leading-7 text-muted-foreground">{body}</p>
                </RevealBlock>
            </div>
        </section>
    )
}
