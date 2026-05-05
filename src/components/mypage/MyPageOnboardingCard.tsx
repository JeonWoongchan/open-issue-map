import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MyPageData } from '@/lib/user/my-page'
import { RotateCcw } from 'lucide-react'
import Link from 'next/link'
import {
  getContributionTypeLabel,
  getExperienceLevelLabel,
  getPurposeLabel,
  getWeeklyHoursLabel,
  renderMyPageValue,
} from './my-page-labels'
import { MyPageProfileField } from './MyPageProfileField'

type MyPageOnboardingCardProps = {
  onboarding: MyPageData['onboarding']
}

export function MyPageOnboardingCard({ onboarding }: MyPageOnboardingCardProps) {
  return (
    <Card className="border border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle>내 추천 기준</CardTitle>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">
              <RotateCcw className="h-3.5 w-3.5" />
              재설정
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <MyPageProfileField
            label="경험 수준"
            value={renderMyPageValue(getExperienceLevelLabel(onboarding.experienceLevel))}
          />
          <MyPageProfileField
            label="주간 가능 시간"
            value={renderMyPageValue(getWeeklyHoursLabel(onboarding.weeklyHours))}
          />
          <MyPageProfileField
            label="기여 목적"
            value={renderMyPageValue(getPurposeLabel(onboarding.purpose))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MyPageProfileField
            label="선호 언어"
            value={
              onboarding.topLanguages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {onboarding.topLanguages.map((language) => (
                    <Badge key={language} variant="outline" className="bg-background/70 text-foreground">
                      {language}
                    </Badge>
                  ))}
                </div>
              ) : (
                '아직 설정되지 않았습니다.'
              )
            }
          />
          <MyPageProfileField
            label="기여 방식"
            value={
              onboarding.contributionTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {onboarding.contributionTypes.map((type) => (
                    <Badge key={type} variant="outline" className="bg-background/70 text-foreground">
                      {getContributionTypeLabel(type)}
                    </Badge>
                  ))}
                </div>
              ) : (
                '아직 설정되지 않았습니다.'
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
