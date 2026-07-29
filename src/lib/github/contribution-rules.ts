import { unstable_cache } from 'next/cache'
import { fetchRepoFile } from './readme'

// README보다 훨씬 드물게 바뀌는 문서라 캐시를 더 길게 잡는다(7일).
const CONTRIBUTION_RULES_CACHE_TTL = 604_800

export type ContributionRules = {
  hasContributingGuide: boolean
  hasPullRequestTemplate: boolean
  hasCommitConvention: boolean
  // CLA 여부는 자동 판별 범위를 의도적으로 축소한다 — 문서에서 키워드가 감지되면 표시하고,
  // 감지되지 않으면 "없음"이 아니라 "확인 필요"로 정직하게 노출한다.
  claStatus: 'detected' | 'unknown'
}

// GitHub이 실제로 인식하는 위치 순서와 맞춘다 — 저장소 루트가 가장 흔하고, .github/·docs/도 관례상 허용된다.
const CONTRIBUTING_PATHS = ['CONTRIBUTING.md', '.github/CONTRIBUTING.md', 'docs/CONTRIBUTING.md']
const PR_TEMPLATE_PATHS = ['.github/PULL_REQUEST_TEMPLATE.md', 'PULL_REQUEST_TEMPLATE.md', 'docs/PULL_REQUEST_TEMPLATE.md']

const COMMIT_CONVENTION_KEYWORDS = ['conventional commits', 'commit convention', 'commit message format', 'feat:', 'fix:', 'chore:']
const CLA_KEYWORDS = ['cla', 'contributor license agreement', 'dco', 'sign-off', 'signed-off-by', 'developer certificate of origin']

// 후보 경로들을 동시에 조회한다 — 대부분의 저장소는 루트에 파일이 없어(콜드 캐시 기준)
// 순차 조회 시 최악의 경우 라운드트립이 그대로 누적된다. paths 순서가 우선순위이므로
// Promise.all로 응답 순서를 보존한 채 첫 번째 non-null 값을 고른다.
async function fetchFirstExistingFile(owner: string, repo: string, paths: string[]): Promise<string | null> {
  const results = await Promise.all(paths.map((path) => fetchRepoFile(owner, repo, path)))
  return results.find((content) => content !== null) ?? null
}

function includesAnyKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase()
  return keywords.some((keyword) => normalized.includes(keyword))
}

async function fetchContributionRules(owner: string, repo: string): Promise<ContributionRules> {
  const [contributingContent, prTemplateContent] = await Promise.all([
    fetchFirstExistingFile(owner, repo, CONTRIBUTING_PATHS),
    fetchFirstExistingFile(owner, repo, PR_TEMPLATE_PATHS),
  ])

  const searchableText = contributingContent ?? ''

  return {
    hasContributingGuide: contributingContent !== null,
    hasPullRequestTemplate: prTemplateContent !== null,
    hasCommitConvention: includesAnyKeyword(searchableText, COMMIT_CONVENTION_KEYWORDS),
    claStatus: includesAnyKeyword(searchableText, CLA_KEYWORDS) ? 'detected' : 'unknown',
  }
}

export const getContributionRules = unstable_cache(
  fetchContributionRules,
  ['github-contribution-rules'],
  { revalidate: CONTRIBUTION_RULES_CACHE_TTL },
)
