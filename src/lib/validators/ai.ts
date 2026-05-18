import { z } from 'zod'

export const issueAnalysisRequestSchema = z.object({
    title: z.string().min(1),
    body: z.string().nullable(),
    labels: z.array(z.string()),
    language: z.string().nullable(),
    repoFullName: z.string().min(1),
})
