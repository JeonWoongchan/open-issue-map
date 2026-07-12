import { describe, it, expect } from 'vitest'
import { INITIAL_BATCH, MAX_BATCH_PARAM_LENGTH, parseBatchParam } from '@/lib/github/batch'

describe('parseBatchParam', () => {
    it('INITIAL_BATCH는 "initial" sentinel 값이다', () => {
        expect(INITIAL_BATCH).toBe('initial')
    })

    it('initial sentinel은 cursor: null로 변환한다', () => {
        expect(parseBatchParam(INITIAL_BATCH)).toEqual({ ok: true, cursor: null })
    })

    it('일반 cursor 문자열은 그대로 cursor로 사용한다', () => {
        expect(parseBatchParam('Y3Vyc29yOjUw')).toEqual({ ok: true, cursor: 'Y3Vyc29yOjUw' })
    })

    it('길이 제한을 초과한 batch 값은 too_long으로 거부한다', () => {
        expect(parseBatchParam('a'.repeat(MAX_BATCH_PARAM_LENGTH + 1))).toEqual({
            ok: false,
            reason: 'too_long',
        })
    })

    it('길이 제한과 정확히 같은 batch 값은 허용한다', () => {
        const cursor = 'a'.repeat(MAX_BATCH_PARAM_LENGTH)
        expect(parseBatchParam(cursor)).toEqual({ ok: true, cursor })
    })
})
