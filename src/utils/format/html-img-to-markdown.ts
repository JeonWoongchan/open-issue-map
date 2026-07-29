const HTML_IMG_TAG = /<img\b[^>]*>/gi
const SRC_ATTR = /\bsrc=["']([^"']+)["']/i
const ALT_ATTR = /\balt=["']([^"']*)["']/i

// GitHub은 이미지를 붙여넣을 때 마크다운(`![]()`) 대신 raw HTML `<img>` 태그로 본문에 넣는 경우가
// 있다(크기를 지정해 붙여넣을 때 특히 그렇다). react-markdown은 raw HTML을 렌더링하지 않고 텍스트로
// 무시하므로, 렌더링 전에 이런 태그만 마크다운 이미지 문법으로 바꿔 정상적으로 보이게 한다.
// <img> 태그 전체를 허용하는 게 아니라 src/alt만 뽑아 마크다운으로 치환하므로, 임의의 HTML(스크립트 등)이
// 그대로 통과할 위험은 없다 — src가 없는 태그는 안전하게 원문 그대로 둔다.
export function convertHtmlImgToMarkdown(text: string): string {
    return text.replace(HTML_IMG_TAG, (tag) => {
        const srcMatch = tag.match(SRC_ATTR)
        if (!srcMatch) return tag

        const altMatch = tag.match(ALT_ATTR)
        const alt = altMatch ? altMatch[1] : ''
        return `![${alt}](${srcMatch[1]})`
    })
}
