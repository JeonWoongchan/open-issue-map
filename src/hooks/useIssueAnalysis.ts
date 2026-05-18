'use client'

import { useQuery } from '@tanstack/react-query'
import type { IssueAnalysis } from '@/lib/ai'
import type { ApiResponse } from '@/types/api'
import type { IssueCardItem } from '@/types/issue'
import { QUERY_KEYS } from './queryKeys'

const DEFAULT_ERROR = 'AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.'

// 비로그인 일일 한도 초과 시 던지는 전용 에러 — Drawer에서 instanceof로 식별한다
export class GuestLimitError extends Error {
    constructor() {
        super('하루 무료 AI 분석 한도(5회)를 초과했습니다.')
        this.name = 'GuestLimitError'
    }
}

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
            // 비로그인 한도 초과 — 전용 에러로 분리해 Drawer가 로그인 유도 모달을 표시한다
            if (res.status === 429) throw new GuestLimitError()
            if (!json.ok) throw new Error(json.error?.message ?? DEFAULT_ERROR)
            return json.data
        },
        enabled: !!issue,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 0,
    })
}
