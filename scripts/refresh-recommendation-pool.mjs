import { appendFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export const LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Rust',
  'Go',
  'Java',
  'C',
  'C++',
  'C#',
  'Ruby',
  'Swift',
  'Kotlin',
  'PHP',
]

const DEFAULT_PACING_MS = 15_000
const DEFAULT_DEADLINE_MS = 25 * 60_000
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000
const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000
const DEFAULT_TRANSIENT_RETRY_WAIT_MS = 10_000
const MAX_RATE_LIMIT_WAIT_MS = 60 * 60_000

function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function retryAfterMs(response, random) {
  const headerSeconds = Number(response.headers.get('retry-after'))
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) {
    return Math.min(MAX_RATE_LIMIT_WAIT_MS, Math.ceil(headerSeconds * 1000))
  }

  // GitHub가 대기 시간을 주지 않은 secondary-limit은 최소 60초 기다린다.
  return DEFAULT_RATE_LIMIT_WAIT_MS + Math.floor(random() * 15_001)
}

async function readResponseBody(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function resultRow(language, status, details = {}) {
  return { language, status, ...details }
}

export function buildSummary(condition, results, durationMs) {
  const lines = [
    `## Recommendation pool refresh: ${condition}`,
    '',
    '| Language | Result | HTTP | Attempts | Detail |',
    '| --- | --- | ---: | ---: | --- |',
  ]

  for (const result of results) {
    lines.push(
      `| ${result.language} | ${result.status} | ${result.httpStatus ?? '-'} | ${result.attempts ?? 0} | ${result.detail ?? '-'} |`,
    )
  }

  lines.push('', `Duration: ${Math.round(durationMs / 1000)}s`)
  return `${lines.join('\n')}\n`
}

export async function runRefresh(options) {
  const {
    condition,
    siteUrl,
    cronSecret,
    languages = LANGUAGES,
    fetchImpl = globalThis.fetch,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = Date.now,
    random = Math.random,
    pacingMs = DEFAULT_PACING_MS,
    deadlineMs = DEFAULT_DEADLINE_MS,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    runId,
    runAttempt,
  } = options

  if (!['latest', 'popular'].includes(condition)) throw new Error(`Invalid condition: ${condition}`)
  if (!siteUrl) throw new Error('SITE_URL is required')
  if (!cronSecret) throw new Error('CRON_SECRET is required')
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable')

  const startedAt = now()
  const deadlineAt = startedAt + deadlineMs
  const results = []
  let globalRateLimitRetryBudget = 1
  let circuitOpen = false

  for (let index = 0; index < languages.length; index++) {
    const language = languages[index]
    if (now() >= deadlineAt) {
      results.push(resultRow(language, 'skipped', { detail: 'deadline' }))
      continue
    }

    let attempts = 0
    let transientRetryAvailable = true
    while (true) {
      attempts++
      const remainingMs = deadlineAt - now()
      if (remainingMs <= 0) {
        results.push(resultRow(language, 'skipped', { attempts, detail: 'deadline' }))
        circuitOpen = true
        break
      }

      const url = new URL('/api/cron/refresh-recommendation-pool', siteUrl)
      url.searchParams.set('condition', condition)
      url.searchParams.set('language', language)

      let response
      try {
        response = await fetchImpl(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cronSecret}`,
            'X-Workflow-Run-Id': String(runId ?? ''),
            'X-Workflow-Run-Attempt': String(runAttempt ?? ''),
          },
          signal: AbortSignal.timeout(Math.max(1, Math.min(requestTimeoutMs, remainingMs))),
        })
      } catch (error) {
        const waitMs = DEFAULT_TRANSIENT_RETRY_WAIT_MS + Math.floor(random() * 5_001)
        if (transientRetryAvailable && now() + waitMs < deadlineAt) {
          transientRetryAvailable = false
          await sleep(waitMs)
          continue
        }
        results.push(resultRow(language, 'failed', {
          attempts,
          detail: error instanceof Error ? error.name : 'network_error',
        }))
        break
      }

      const body = await readResponseBody(response)
      if (response.ok) {
        results.push(resultRow(language, 'succeeded', {
          attempts,
          httpStatus: response.status,
          detail: body?.data?.refreshStatus ?? 'stored',
        }))
        break
      }

      const errorCode = body?.error?.code
      const isAuthenticationFailure = response.status === 401
        || errorCode === 'UNAUTHORIZED'
        || errorCode === 'GITHUB_AUTH_ERROR'

      if (isAuthenticationFailure) {
        results.push(resultRow(language, 'failed', {
          attempts,
          httpStatus: response.status,
          detail: errorCode ?? `http_${response.status}`,
        }))
        circuitOpen = true
        break
      }

      if (response.status === 429) {
        if (globalRateLimitRetryBudget <= 0) {
          results.push(resultRow(language, 'failed', {
            attempts,
            httpStatus: response.status,
            detail: 'rate_limit_circuit_open',
          }))
          circuitOpen = true
          break
        }

        const waitMs = retryAfterMs(response, random)
        if (now() + waitMs >= deadlineAt) {
          results.push(resultRow(language, 'failed', {
            attempts,
            httpStatus: response.status,
            detail: 'rate_limit_exceeds_deadline',
          }))
          circuitOpen = true
          break
        }

        globalRateLimitRetryBudget--
        await sleep(waitMs)
        continue
      }

      const isTransientFailure = response.status === 500
        || response.status === 502
        || response.status === 504
      if (isTransientFailure && transientRetryAvailable) {
        const waitMs = DEFAULT_TRANSIENT_RETRY_WAIT_MS + Math.floor(random() * 5_001)
        if (now() + waitMs < deadlineAt) {
          transientRetryAvailable = false
          await sleep(waitMs)
          continue
        }
      }

      results.push(resultRow(language, 'failed', {
        attempts,
        httpStatus: response.status,
        detail: errorCode ?? `http_${response.status}`,
      }))

      // 설정/인증 오류는 뒤 언어에서도 동일하게 실패하므로 즉시 중단한다.
      if (response.status === 400) circuitOpen = true
      break
    }

    if (circuitOpen) {
      for (const remainingLanguage of languages.slice(index + 1)) {
        results.push(resultRow(remainingLanguage, 'skipped', { detail: 'circuit_open' }))
      }
      break
    }

    if (index < languages.length - 1) {
      if (now() + pacingMs >= deadlineAt) {
        for (const remainingLanguage of languages.slice(index + 1)) {
          results.push(resultRow(remainingLanguage, 'skipped', { detail: 'deadline' }))
        }
        break
      }
      await sleep(pacingMs)
    }
  }

  const durationMs = now() - startedAt
  return {
    results,
    durationMs,
    exitCode: results.every((result) => result.status === 'succeeded') ? 0 : 1,
    summary: buildSummary(condition, results, durationMs),
  }
}

async function main() {
  const result = await runRefresh({
    condition: process.env.REFRESH_CONDITION,
    siteUrl: process.env.SITE_URL,
    cronSecret: process.env.CRON_SECRET,
    pacingMs: positiveInteger(process.env.REFRESH_PACING_MS, DEFAULT_PACING_MS),
    deadlineMs: positiveInteger(process.env.REFRESH_DEADLINE_MS, DEFAULT_DEADLINE_MS),
    requestTimeoutMs: positiveInteger(process.env.REFRESH_REQUEST_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS),
    runId: process.env.GITHUB_RUN_ID,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  })

  process.stdout.write(result.summary)
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, result.summary, 'utf8')
  }
  process.exitCode = result.exitCode
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
