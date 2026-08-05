'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignInButton } from '@/components/shared/SignInButton'
import { IssueCard } from '@/components/dashboard/issue/IssueCard'
import { AiGuidePanel } from '@/components/issue-detail/AiGuidePanel'
import { ExperienceStep } from '@/components/onboarding/steps/ExperienceStep'
import { StepProgress } from '@/components/onboarding/StepProgress'
import { ONBOARDING_STEPS } from '@/constants/contribution-levels'
import { signInWithGitHub } from '@/lib/auth-actions'
import { cn } from '@/lib/utils'
import type { IssueAnalysis } from '@/lib/ai'
import { InertDemo } from './InertDemo'
import { LandingDriftBackground } from './LandingDriftBackground'
import { LANDING_DEMO_ISSUES, noopToggleBookmark } from './landing-demo-issues'
import { LANDING_FIRST_SECTION_ID } from './landing-constants'
import { ImageBox, RevealBlock, StorySection, STORY_SECTION_CLASS, type StorySectionData } from './StorySection'

function LandingIssueCarouselDemo() {
    return (
        <InertDemo>
            <div className="flex items-stretch gap-3">
                {LANDING_DEMO_ISSUES.map((issue) => (
                    <div key={issue.number} className="w-[240px] shrink-0">
                        <IssueCard issue={issue} onToggleBookmark={noopToggleBookmark} />
                    </div>
                ))}
            </div>
        </InertDemo>
    )
}

const LANDING_DEMO_ANALYSIS: IssueAnalysis = {
    concepts: ['React Query', 'WebSocket'],
    scope: '재연결 로직이 useSocket.ts 안에서 중복 실행되는 문제예요 — 이벤트 리스너 정리 시점만 고치면 되는 국소적인 수정입니다.',
    startingPoints: ['src/hooks/useSocket.ts', 'src/lib/socket-client.ts'],
    cautions: ['빠르게 재연결될 때 이벤트 리스너가 중복 등록되지 않는지 확인하세요.'],
    expectedBenefit: 'React Query와 WebSocket을 함께 다루는 실전 감각을 익힐 수 있어요.',
    issueOverview: {
        summary: 'WebSocket 재연결 시 이벤트 리스너가 정리되지 않는 문제',
        analysis: '네트워크가 끊겼다 다시 연결될 때마다 이전 리스너가 남아있어 메시지가 중복 처리돼요.',
        summarySections: [{ heading: null, items: ['재연결마다 리스너가 누적되어 같은 메시지가 여러 번 처리됨'] }],
    },
    contributionGuideInsight: {
        commitConventionNote: 'Conventional Commits(feat/fix/docs) 형식을 따르고 있어요.',
        claNote: '별도 CLA 서명 절차는 없어요.',
    },
    contributionRules: {
        contributingGuidePath: 'CONTRIBUTING.md',
        pullRequestTemplatePath: null,
    },
}

function LandingAiGuideDemo() {
    return (
        <InertDemo>
            <div className="w-full">
                <AiGuidePanel analysis={LANDING_DEMO_ANALYSIS} />
            </div>
        </InertDemo>
    )
}

function LandingOnboardingDemo() {
    const [experience] = useState<'junior'>('junior')
    return (
        <InertDemo>
            <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-lg">
                <StepProgress currentStep={0} labels={ONBOARDING_STEPS.map((step) => step.label)} />
                <ExperienceStep value={experience} onChangeAction={() => {}} />
            </div>
        </InertDemo>
    )
}

const STORY_SECTIONS: StorySectionData[] = [
    {
        headingId: 'landing-section-1-heading',
        sectionId: LANDING_FIRST_SECTION_ID,
        heading: '온보딩을 통해 추천 기준 수립',
        body: '언어·경험·목적만 알려주면 바로 추천을 받을 수 있어요.',
        visual: (
            <ImageBox tone="amber">
                <LandingOnboardingDemo />
            </ImageBox>
        ),
    },
    {
        headingId: 'landing-section-2-heading',
        heading: '온보딩 기반 추천 점수 산정',
        body: '온보딩 답변과 이슈 정보를 비교한 추천 점수를 비교해보세요.',
        reverseOnDesktop: true,
        visual: (
            <ImageBox tone="neutral" fadeDirection="right">
                <LandingIssueCarouselDemo />
            </ImageBox>
        ),
    },
    {
        headingId: 'landing-section-3-heading',
        heading: '빠른 기여를 돕는 AI 가이드 제공',
        body: '기여를 시작하기 전에 AI가이드로 빠르게 방향을 잡아보세요.',
        visual: (
            <ImageBox tone="success">
                <LandingAiGuideDemo />
            </ImageBox>
        ),
    },
]

export function LandingStory() {
    return (
        <div className="isolate">
            {/* DOM 순서상 콘텐츠보다 먼저 나오므로 z-index 없이도 자연스럽게 뒤에 깔린다. */}
            <div className="sticky top-0 h-[100svh]">
                <LandingDriftBackground />
            </div>

            <div className="relative -mt-[100svh]">
                {STORY_SECTIONS.map((section) => (
                    <StorySection key={section.headingId} {...section} />
                ))}

                {/* relative + isolate로 로컬 스태킹 컨텍스트를 만들어 글로우(-z-10)를 이 섹션 안에 가둔다. */}
                <section
                    aria-labelledby="landing-closing-heading"
                    className={cn(STORY_SECTION_CLASS, 'relative isolate justify-center text-center')}
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_60%_at_50%_45%,color-mix(in_oklab,var(--interactive-action)_22%,transparent),transparent_72%)]"
                    />
                    <RevealBlock className="mx-auto max-w-xl">
                        <h2 id="landing-closing-heading" className="text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                            지금, 나에게 맞는<br/> 첫 이슈를 찾아보세요
                        </h2>
                        <p className="mt-4 text-[15px] text-muted-foreground">가입은 GitHub 계정 하나면 충분해요.</p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <form action={signInWithGitHub}>
                                <SignInButton size="lg" className="w-full sm:w-auto" />
                            </form>
                            <Button asChild variant="interactive" size="lg">
                                <Link href="/dashboard">추천 이슈 미리보기</Link>
                            </Button>
                        </div>
                    </RevealBlock>
                </section>
            </div>
        </div>
    )
}
