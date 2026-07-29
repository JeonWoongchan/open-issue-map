import { HTML_COMMENT, CHECKBOX_LINE, BLOCKQUOTE_MARKER, HORIZONTAL_RULE } from './markdown-patterns'

// 이슈 본문(raw markdown)에서 카드 미리보기용 순수 텍스트만 뽑아낸다.
// AI 프롬프트에 넘기는 원본 body(ISSUE_BODY_PREVIEW_LENGTH, 마크다운 그대로)와는 별개 용도 —
// 사람이 읽는 카드 요약에서 헤딩/체크박스/이미지/코드블록 같은 마크다운 잡음을 지운다.
const MARKDOWN_NOISE_PATTERNS: [RegExp, string][] = [
  [HTML_COMMENT, ' '], // HTML 주석 (템플릿 안내 문구)
  [/```[\s\S]*?```/g, ' '], // 코드 블록
  [/!\[[^\]]*\]\([^)]*\)/g, ' '], // 이미지
  [/\[([^\]]*)\]\([^)]*\)/g, '$1'], // 링크 → 텍스트만
  [/`([^`]*)`/g, '$1'], // 인라인 코드
  [/^#{1,6}[^\n]*\n?/gm, ''], // 헤딩 줄 전체 — 이슈 템플릿 섹션 라벨(Describe the bug 등)이라 내용이 아니라 잡음
  [CHECKBOX_LINE, ''], // 체크박스 줄 전체 — 템플릿 체크리스트, 본문 내용 아님
  [BLOCKQUOTE_MARKER, ''], // 인용
  [HORIZONTAL_RULE, ''], // 구분선
  [/(\*\*|__)(.*?)\1/g, '$2'], // 굵게
  [/(\*|_)(.*?)\1/g, '$2'], // 기울임
]

const MIN_PREVIEW_LENGTH = 10

export function stripMarkdownPreview(body: string): string | null {
  let text = body
  for (const [pattern, replacement] of MARKDOWN_NOISE_PATTERNS) {
    text = text.replace(pattern, replacement)
  }
  text = text.replace(/\s+/g, ' ').trim()

  return text.length >= MIN_PREVIEW_LENGTH ? text : null
}
