'use client'

import { useQuery } from '@tanstack/react-query'
import type { IssueAnalysis } from '@/lib/ai'
import type { ApiResponse } from '@/types/api'
import type { IssueCardItem } from '@/types/issue'
import { QUERY_KEYS } from './queryKeys'

const DEFAULT_ERROR = 'AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.'

export function useIssueAnalysis(issue: IssueCardItem | null) {
    return useQuery({
        queryKey: QUERY_KEYS.aiAnalysis(issue?.url ?? ''),
        queryFn: async (): Promise<IssueAnalysis> => {
            if (!issue) throw new Error('issue is null')
            const res = await fetch('/api/ai/issue-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: issue.title,
                    body: issue.body ?? null,
                    labels: issue.labels,
                    language: issue.language,
                    repoFullName: issue.repoFullName,
                }),
            })
            const json = (await res.json()) as ApiResponse<IssueAnalysis>
            if (!json.ok) throw new Error(json.error?.message ?? DEFAULT_ERROR)
            return json.data
        },
        enabled: !!issue,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 0,
    })
}
