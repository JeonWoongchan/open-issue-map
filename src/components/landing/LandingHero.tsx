import Link from 'next/link'
import { Bookmark, ChevronDown, GitPullRequestArrow, Map, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignInButton } from '@/components/shared/SignInButton'
import { signInWithGitHub } from '@/lib/auth-actions'
import { SITE_TITLE } from '@/lib/seo'
import { LandingConstellation } from './LandingConstellation'
import { LANDING_FIRST_SECTION_ID } from './landing-constants'

const HERO_FEATURE_ITEMS = [
    {
        icon: Search,
        title: '기여 가능한 이슈 탐색',
        description: 'GitHub 이슈를 언어, 난이도, 라벨, 활동성 기준으로 확인합니다.',
    },
    {
        icon: Map,
        title: '온보딩 기반 추천',
        description: '관심 언어와 기여 목적을 반영해 시작하기 좋은 이슈를 우선 보여줍니다.',
    },
    {
        icon: Sparkles,
        title: 'AI 작업 가이드',
        description: '이슈별 예상 난이도, 작업 범위, 필요한 개념, 먼저 확인할 파일을 AI가 분석해 알려줍니다.',
    },
    {
        icon: Bookmark,
        title: '관심 이슈 저장',
        description: '나중에 다시 볼 이슈를 북마크하고 기여 후보를 정리합니다.',
    },
    {
        icon: GitPullRequestArrow,
        title: 'PR 기록 확인',
        description: '제출한 Pull Request 기록을 모아 오픈소스 기여 흐름을 추적합니다.',
    },
] as const

export function LandingHero() {
    return (
        <section className="relative flex min-h-[100svh] items-center overflow-hidden px-4 py-14">
            <LandingConstellation />
            <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="flex min-w-0 flex-col items-start">
                    <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-subtle-border bg-brand-subtle px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                        {SITE_TITLE}
                    </span>
                    <h1 className="max-w-3xl break-keep text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
                        나에게 맞는 오픈소스 이슈를 <span className="text-primary">추천</span>받아보세요
                    </h1>
                    <p className="mt-6 max-w-3xl break-keep text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                        {SITE_TITLE}은 사용자 온보딩 정보를 바탕으로 검토해볼 만한 오픈소스 이슈를 추천하는 서비스입니다. 매일 쌓이는 수많은 이슈 속에서 나에게 맞는 이슈를 골라보세요.
                    </p>
                    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                        <form action={signInWithGitHub}>
                            <SignInButton size="lg" className="w-full sm:w-auto" />
                        </form>
                        <Button asChild variant="interactive" size="lg">
                            <Link href="/dashboard">추천 이슈 미리보기</Link>
                        </Button>
                    </div>
                </div>
                <div className="hidden min-w-0 grid-cols-1 gap-3 lg:grid">
                    {HERO_FEATURE_ITEMS.map(({ icon: Icon, title, description }) => (
                        <article key={title} className="rounded-md border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-primary">
                                    <Icon className="size-4" aria-hidden="true" />
                                </span>
                                <div className="space-y-1">
                                    <h2 className="break-keep text-sm font-semibold text-foreground">{title}</h2>
                                    <p className="break-keep text-sm leading-6 text-muted-foreground">{description}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
            <a
                href={`#${LANDING_FIRST_SECTION_ID}`}
                aria-label="아래로 스크롤"
                className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
                <span className="text-xs">스크롤해서 더 보기</span>
                <ChevronDown className="size-5 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
            </a>
        </section>
    )
}
