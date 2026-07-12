// 첫 번째 배치임을 나타내는 sentinel — cursor 없이 GitHub 첫 페이지 요청
export const INITIAL_BATCH = 'initial' as const
export const MAX_BATCH_PARAM_LENGTH = 500

type ParseBatchResult =
    | { ok: true; cursor: string | null }
    | { ok: false; reason: 'too_long' }

// batch 쿼리 파라미터는 GitHub가 발급한 cursor 값 그 자체다(또는 INITIAL_BATCH sentinel).
export function parseBatchParam(batchParam: string): ParseBatchResult {
    if (batchParam === INITIAL_BATCH) {
        return { ok: true, cursor: null }
    }

    if (batchParam.length > MAX_BATCH_PARAM_LENGTH) {
        return { ok: false, reason: 'too_long' }
    }

    return { ok: true, cursor: batchParam }
}
