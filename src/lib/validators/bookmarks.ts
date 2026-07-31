import { z } from 'zod'

// 북마크 식별에 필요한 공통 필드 — POST/DELETE 양쪽에서 재사용
// repoFullName: GitHub owner(39) + '/' + repo(100) = 140자 이하가 정상이나 여유를 둠
const bookmarkBaseSchema = z.object({
    issueNumber: z.number().int().positive(),
    repoFullName: z.string().min(1).max(200),
})

// 북마크 저장 시점의 이슈 카드 데이터 전체 — 이후 목록 조회는 GitHub을 다시 조회하지 않고
// 이 스냅샷을 그대로 보여주므로, 카드 렌더링에 필요한 필드를 전부 저장 시점에 받는다.
export const bookmarkPostSchema = bookmarkBaseSchema.extend({
    issueTitle: z.string().min(1).max(512),
    issueUrl: z.string().url().max(1024),
    repoUrl: z.string().url().max(1024),
    language: z.string().max(100).nullable(),
    stargazerCount: z.number().int().min(0),
    labels: z.array(z.string().max(200)).max(50),
    commentCount: z.number().int().min(0),
    issueBody: z.string().max(2000).nullable().optional(),
    issueCreatedAt: z.string(),
    issueUpdatedAt: z.string(),
    score: z.number().int().nullable().optional(),
    difficultyLevel: z.enum(['beginner', 'junior', 'mid', 'senior']).nullable().optional(),
    contributionType: z.enum(['doc', 'bug', 'feat', 'test', 'review']).nullable().optional(),
    competitionLevel: z.enum(['OPEN', 'ACTIVE', 'HAS_PR']).nullable().optional(),
    hasPR: z.boolean(),
    repoActivityLevel: z.enum(['active', 'moderate', 'quiet']).nullable().optional(),
})

export const bookmarkDeleteSchema = bookmarkBaseSchema
