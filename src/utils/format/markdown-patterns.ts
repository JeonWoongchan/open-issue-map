// 마크다운 잡음(내용이 아니라 서식/템플릿 장식)을 지우는 곳이 여러 군데다 — AI 프롬프트용
// 이슈 본문 정제(preprocess.ts)와 사람이 읽는 카드 미리보기 정제(strip-markdown-preview.ts)가
// 정확히 같은 패턴을 각자 따로 갖고 있었다. 여기 한 곳에 모아 두 소비자가 같은 정규식을 공유한다.
export const HTML_COMMENT = /<!--[\s\S]*?-->/g
export const CHECKBOX_LINE = /^[-*]\s*\[[ xX]\][^\n]*\n?/gm
export const BLOCKQUOTE_MARKER = /^>\s*/gm
export const HORIZONTAL_RULE = /^-{3,}\s*$/gm
