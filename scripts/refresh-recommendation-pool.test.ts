import { readFile } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'
import { runRefresh } from './refresh-recommendation-pool.mjs'

function response(status: number, body: object = {}, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

function harness(responses: Response[]) {
  let currentTime = 0
  const callTimes: number[] = []
  const waits: number[] = []
  const fetchImpl = vi.fn(async () => {
    callTimes.push(currentTime)
    const next = responses.shift()
    if (!next) throw new Error('unexpected fetch')
    return next
  })

  return {
    fetchImpl,
    callTimes,
    waits,
    now: () => currentTime,
    sleep: async (ms: number) => {
      waits.push(ms)
      currentTime += ms
    },
  }
}

const baseOptions = {
  condition: 'latest',
  siteUrl: 'https://example.com',
  cronSecret: 'secret',
  requestTimeoutMs: 60_000,
  deadlineMs: 25 * 60_000,
} as const

describe('recommendation pool refresh orchestrator', () => {
  it('언어 요청을 완료 시점 기준 15초 간격으로 순차 실행한다', async () => {
    const test = harness([
      response(200, { data: { refreshStatus: 'stored' } }),
      response(200, { data: { refreshStatus: 'stored' } }),
      response(200, { data: { refreshStatus: 'preserved' } }),
    ])

    const result = await runRefresh({
      ...baseOptions,
      languages: ['TypeScript', 'Python', 'Go'],
      ...test,
    })

    expect(test.callTimes).toEqual([0, 15_000, 30_000])
    expect(result.exitCode).toBe(0)
    expect(result.results.map((item) => item.status)).toEqual(['succeeded', 'succeeded', 'succeeded'])
  })

  it('429는 Retry-After만큼 전역 대기한 뒤 같은 언어를 한 번 재시도한다', async () => {
    const test = harness([
      response(429, {}, { 'retry-after': '70' }),
      response(200, { data: { refreshStatus: 'stored' } }),
      response(200, { data: { refreshStatus: 'stored' } }),
    ])

    const result = await runRefresh({
      ...baseOptions,
      languages: ['TypeScript', 'Python'],
      ...test,
    })

    expect(test.waits).toEqual([70_000, 15_000])
    expect(test.callTimes).toEqual([0, 70_000, 85_000])
    expect(result.results[0]).toMatchObject({ status: 'succeeded', attempts: 2 })
  })

  it('재시도도 429면 circuit breaker를 열고 남은 언어를 호출하지 않는다', async () => {
    const test = harness([
      response(429, {}, { 'retry-after': '60' }),
      response(429),
    ])

    const result = await runRefresh({
      ...baseOptions,
      languages: ['TypeScript', 'Python', 'Go'],
      ...test,
    })

    expect(test.fetchImpl).toHaveBeenCalledTimes(2)
    expect(result.exitCode).toBe(1)
    expect(result.results).toEqual([
      expect.objectContaining({ language: 'TypeScript', status: 'failed', detail: 'rate_limit_circuit_open' }),
      expect.objectContaining({ language: 'Python', status: 'skipped', detail: 'circuit_open' }),
      expect.objectContaining({ language: 'Go', status: 'skipped', detail: 'circuit_open' }),
    ])
  })

  it('429 재시도 예산은 언어별이 아니라 전체 실행에서 한 번만 사용한다', async () => {
    const test = harness([
      response(429, {}, { 'retry-after': '60' }),
      response(200, { data: { refreshStatus: 'stored' } }),
      response(429),
    ])

    const result = await runRefresh({
      ...baseOptions,
      languages: ['TypeScript', 'Python', 'Go'],
      ...test,
    })

    expect(test.fetchImpl).toHaveBeenCalledTimes(3)
    expect(test.waits).toEqual([60_000, 15_000])
    expect(result.results[1]).toMatchObject({
      language: 'Python',
      status: 'failed',
      attempts: 1,
      detail: 'rate_limit_circuit_open',
    })
    expect(result.results[2]).toMatchObject({ status: 'skipped' })
  })

  it('인증 오류는 즉시 중단하고 남은 언어를 미실행 처리한다', async () => {
    const test = harness([response(401, { error: { code: 'UNAUTHORIZED' } })])

    const result = await runRefresh({
      ...baseOptions,
      languages: ['TypeScript', 'Python'],
      ...test,
    })

    expect(test.fetchImpl).toHaveBeenCalledTimes(1)
    expect(result.results.map((item) => item.status)).toEqual(['failed', 'skipped'])
  })

  it('네트워크와 일시적 5xx는 언어별로 한 번만 재시도한다', async () => {
    const test = harness([
      response(502, { error: { code: 'GITHUB_ERROR' } }),
      response(200, { data: { refreshStatus: 'stored' } }),
    ])

    const result = await runRefresh({
      ...baseOptions,
      languages: ['TypeScript'],
      random: () => 0,
      ...test,
    })

    expect(test.waits).toEqual([10_000])
    expect(test.fetchImpl).toHaveBeenCalledTimes(2)
    expect(result.results[0]).toMatchObject({ status: 'succeeded', attempts: 2 })
  })

  it('서버 GitHub 인증 오류는 502여도 재시도하지 않고 즉시 중단한다', async () => {
    const test = harness([response(502, { error: { code: 'GITHUB_AUTH_ERROR' } })])

    const result = await runRefresh({
      ...baseOptions,
      languages: ['TypeScript', 'Python'],
      ...test,
    })

    expect(test.fetchImpl).toHaveBeenCalledTimes(1)
    expect(test.waits).toEqual([])
    expect(result.results.map((item) => item.status)).toEqual(['failed', 'skipped'])
  })

  it('workflow는 공통 concurrency와 30분 timeout으로 단일 오케스트레이터를 실행한다', async () => {
    const workflow = await readFile('.github/workflows/refresh-recommendation-pool.yml', 'utf8')

    expect(workflow).toContain('group: recommendation-pool-refresh')
    expect(workflow).toContain('cancel-in-progress: false')
    expect(workflow).toContain('timeout-minutes: 30')
    expect(workflow).toContain('node scripts/refresh-recommendation-pool.mjs')
    expect(workflow).not.toContain('matrix:')
  })
})
