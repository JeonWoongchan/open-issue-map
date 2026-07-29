import { unstable_cache } from 'next/cache'
import { cleanMarkdownForAi, fetchRepoFile } from './readme'

// README보다 훨씬 드물게 바뀌는 문서라 캐시를 더 길게 잡는다(7일).
const CONTRIBUTION_RULES_CACHE_TTL = 604_800

export type ContributionRules = {
  // 실제로 찾은 경로 — null이면 못 찾은 것. UI에서 "확인했어요" 대신 경로 자체를 보여준다.
  contributingGuidePath: string | null
  pullRequestTemplatePath: string | null
  // CONTRIBUTING.md 원문(정제됨) — 커밋 컨벤션·CLA 여부는 단순 존재 확인으로 판별할 수 없어
  // AI가 이 원문을 읽고 문맥까지 판단하도록 넘긴다. 파일이 없으면 null.
  contributingGuideText: string | null
}

// GitHub이 실제로 인식하는 위치 순서와 맞춘다 — 저장소 루트가 가장 흔하고, .github/·docs/도 관례상 허용된다.
const CONTRIBUTING_PATHS = ['CONTRIBUTING.md', '.github/CONTRIBUTING.md', 'docs/CONTRIBUTING.md']
const PR_TEMPLATE_PATHS = ['.github/PULL_REQUEST_TEMPLATE.md', 'PULL_REQUEST_TEMPLATE.md', 'docs/PULL_REQUEST_TEMPLATE.md']

type ExistingFile = { path: string; content: string }

// 후보 경로들을 동시에 조회한다 — 대부분의 저장소는 루트에 파일이 없어(콜드 캐시 기준)
// 순차 조회 시 최악의 경우 라운드트립이 그대로 누적된다. paths 순서가 우선순위이므로
// Promise.all로 응답 순서를 보존한 채 첫 번째 non-null 값을 고른다.
async function fetchFirstExistingFile(owner: string, repo: string, paths: string[]): Promise<ExistingFile | null> {
  const results = await Promise.all(
    paths.map(async (path) => {
      const content = await fetchRepoFile(owner, repo, path)
      return content !== null ? { path, content } : null
    }),
  )
  return results.find((file) => file !== null) ?? null
}

async function fetchContributionRules(owner: string, repo: string): Promise<ContributionRules> {
  const [contributing, prTemplate] = await Promise.all([
    fetchFirstExistingFile(owner, repo, CONTRIBUTING_PATHS),
    fetchFirstExistingFile(owner, repo, PR_TEMPLATE_PATHS),
  ])

  return {
    contributingGuidePath: contributing?.path ?? null,
    pullRequestTemplatePath: prTemplate?.path ?? null,
    contributingGuideText: contributing ? cleanMarkdownForAi(contributing.content) : null,
  }
}

export const getContributionRules = unstable_cache(
  fetchContributionRules,
  ['github-contribution-rules'],
  { revalidate: CONTRIBUTION_RULES_CACHE_TTL },
)
