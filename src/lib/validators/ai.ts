import { z } from 'zod'

export const issueAnalysisRequestSchema = z.object({
    // GitHub 이슈 제목 — 빈 값과 과도하게 긴 값 차단
    title: z.string().min(1).max(1000),
    // 이슈 본문 — cleanIssueBody에서 2000자로 잘리지만 서버 파싱 전 대용량 입력 차단
    body: z.string().max(50000).nullable(),
    labels: z.array(z.string().max(100)).max(50),
    language: z.string().nullable(),
    // owner/repo 형식 강제 — 슬래시 없는 입력이 URL 구성에 사용되는 것을 방지
    repoFullName: z.string().regex(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/, {
        message: 'repoFullName must be in owner/repo format',
    }),
})
