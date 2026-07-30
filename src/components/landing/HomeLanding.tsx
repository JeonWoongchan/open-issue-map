import { AppFooter } from '@/components/layout/AppFooter'
import { LandingHeader } from './LandingHeader'
import { LandingHero } from './LandingHero'
import { LandingStory } from './LandingStory'

export function HomeLanding() {
    return (
        <main className="min-h-screen">
            <LandingHeader />
            <LandingHero />
            <LandingStory />
            <div className="mx-auto max-w-7xl px-4">
                <AppFooter />
            </div>
        </main>
    )
}
