import { describe, it, expect, vi } from 'vitest'
import { withSingleFlight } from '@/lib/singleflight'

describe('withSingleFlight', () => {
    it('같은 key로 동시에 들어온 호출은 run을 한 번만 실행하고 결과를 공유한다', async () => {
        const run = vi.fn(() => Promise.resolve('value'))

        const [a, b] = await Promise.all([
            withSingleFlight('key-1', run),
            withSingleFlight('key-1', run),
        ])

        expect(run).toHaveBeenCalledTimes(1)
        expect(a).toBe('value')
        expect(b).toBe('value')
    })

    it('이전 호출이 끝난 뒤 같은 key로 다시 호출하면 run을 다시 실행한다', async () => {
        const run = vi.fn(() => Promise.resolve('value'))

        await withSingleFlight('key-2', run)
        await withSingleFlight('key-2', run)

        expect(run).toHaveBeenCalledTimes(2)
    })

    it('서로 다른 key는 각자 독립적으로 실행된다', async () => {
        const run = vi.fn(() => Promise.resolve('value'))

        await Promise.all([
            withSingleFlight('key-a', run),
            withSingleFlight('key-b', run),
        ])

        expect(run).toHaveBeenCalledTimes(2)
    })

    it('진행 중인 호출이 실패해도 이후 같은 key 호출은 새로 실행된다', async () => {
        const run = vi
            .fn()
            .mockRejectedValueOnce(new Error('fail'))
            .mockResolvedValueOnce('recovered')

        await expect(withSingleFlight('key-3', run)).rejects.toThrow('fail')
        await expect(withSingleFlight('key-3', run)).resolves.toBe('recovered')
        expect(run).toHaveBeenCalledTimes(2)
    })

    it('동시에 들어온 호출이 실패하면 공유한 쪽도 같은 에러를 받는다', async () => {
        const run = vi.fn(() => Promise.reject(new Error('shared failure')))

        const call1 = withSingleFlight('key-4', run)
        const call2 = withSingleFlight('key-4', run)

        await expect(call1).rejects.toThrow('shared failure')
        await expect(call2).rejects.toThrow('shared failure')
        expect(run).toHaveBeenCalledTimes(1)
    })
})
