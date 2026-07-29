import { unstable_cache } from 'next/cache'

const README_CACHE_TTL = 86_400  // 24시간
const MAX_MARKDOWN_LENGTH = 5_000  // 배지 제거 후 실질 내용 확보를 위해 넉넉히

/**
 * 저장소 마크다운 문서(README, CONTRIBUTING 등)를 AI 전송용으로 정제한다.
 * - 이미지·배지 제거: `![...](...)` 패턴 (토큰 낭비)
 * - 마크다운 링크 → 텍스트만: URL은 노이즈
 * - HTML 태그 제거
 * - 코드 블록 유지: 설치·실행 명령이 기여 시작에 유용
 * - 연속 개행 정규화
 */
export function cleanMarkdownForAi(raw: string): string {
    return raw
        .replace(/!\[.*?\]\(.*?\)/g, '')              // 이미지·배지 제거
        .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')       // 링크 → 텍스트만 (빈 링크 포함)
        .replace(/<[^>]+>/g, '')                       // HTML 태그 제거
        .replace(/\n{3,}/g, '\n\n')                   // 연속 개행 정규화
        .trim()
        .slice(0, MAX_MARKDOWN_LENGTH)
}

export async function fetchRepoFile(owner: string, repo: string, path: string): Promise<string | null> {
    const accessToken = process.env.GITHUB_TOKEN
    if (!accessToken) return null

    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${accessToken}`,
            },
        },
    )
    if (!res.ok) return null

    const data = (await res.json()) as { encoding?: string; content?: string }
    if (data.encoding !== 'base64' || !data.content) return null

    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8')
}

async function fetchRepoReadme(owner: string, repo: string): Promise<string | null> {
    const raw = await fetchRepoFile(owner, repo, 'README.md')
    return raw ? cleanMarkdownForAi(raw) : null
}

export const getRepoReadme = unstable_cache(
    fetchRepoReadme,
    ['github-readme'],
    { revalidate: README_CACHE_TTL },
)
