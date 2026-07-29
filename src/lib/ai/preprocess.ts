import { HTML_COMMENT, CHECKBOX_LINE, BLOCKQUOTE_MARKER, HORIZONTAL_RULE } from '@/utils/format/markdown-patterns'

// README·CONTRIBUTING 원문 캡(cleanMarkdownForAi)과 같은 자릿수로 맞춘다 — 실제 이슈 본문은
// 대부분 이 안에 다 들어가면서도, 악의적으로 붙여넣은 대용량 로그 등 극단적인 경우의 비용은 막는다.
const MAX_BODY_LENGTH = 8_000

export function cleanIssueBody(body: string | null): string {
    if (!body) return ''

    return body
        .replace(HTML_COMMENT, '')                       // HTML 주석(템플릿 안내 문구) — 내용이 아니라 노이즈
        .replace(/```[\s\S]*?```/g, '[코드 블록 생략]')
        .replace(/<[^>]+>/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(CHECKBOX_LINE, '')                       // 체크박스 줄 전체 제거 — 템플릿 확인용, 내용 아님
        .replace(BLOCKQUOTE_MARKER, '')                   // 인용 마커만 제거, 내용은 유지
        .replace(HORIZONTAL_RULE, '')                     // 구분선 제거
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, MAX_BODY_LENGTH)
}
