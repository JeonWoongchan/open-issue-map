const MAX_BODY_LENGTH = 2000

export function cleanIssueBody(body: string | null): string {
    if (!body) return ''

    return body
        .replace(/```[\s\S]*?```/g, '[코드 블록 생략]')
        .replace(/<[^>]+>/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, MAX_BODY_LENGTH)
}
