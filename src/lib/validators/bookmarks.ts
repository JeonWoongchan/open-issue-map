import { z } from 'zod'

// 북마크 식별에 필요한 공통 필드 — POST/DELETE 양쪽에서 재사용
// repoFullName: GitHub owner(39) + '/' + repo(100) = 140자 이하가 정상이나 여유를 둠
const bookmarkBaseSchema = z.object({
    issueNumber: z.number().int().positive(),
    repoFullName: z.string().min(1).max(200),
})

export const bookmarkPostSchema = bookmarkBaseSchema.extend({
    issueTitle: z.string().min(1).max(512),
    issueUrl: z.string().url().max(1024),
    contributionType: z.enum(['doc', 'bug', 'feat', 'test', 'review']).nullable().optional(),
})

export const bookmarkDeleteSchema = bookmarkBaseSchema
