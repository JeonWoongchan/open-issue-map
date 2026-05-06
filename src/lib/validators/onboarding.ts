import { z } from 'zod'
import { POPULAR_LANGUAGES } from '@/constants/contribution-levels'

const MAX_TOP_LANGUAGES = POPULAR_LANGUAGES.length

// src/types/user.ts의 OnboardingSurvey와 구조적으로 동일하게 유지해야 함
export const onboardingSurveySchema = z.object({
    experienceLevel: z.enum(['beginner', 'junior', 'mid', 'senior']),
    contributionTypes: z.array(z.enum(['doc', 'bug', 'feat', 'test', 'review'])).min(1).max(5),
    topLanguages: z.array(z.string().min(1).max(50)).min(1).max(MAX_TOP_LANGUAGES),
    // WeeklyHours 허용값 외 숫자는 거부
    weeklyHours: z.union([z.literal(2), z.literal(5), z.literal(10)]),
    purpose: z.enum(['portfolio', 'growth', 'community']),
})
