'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { convertHtmlImgToMarkdown } from '@/utils/format/html-img-to-markdown'

type IssueBodyMarkdownProps = {
  body: string
}

// react-markdown·remark-gfm은 이 컴포넌트에서만 쓰이는데도 정적 import하면 이슈 상세 페이지의
// 초기 번들에 항상 포함된다 — "본문 전체" 탭은 기본 선택도 아니고 안 눌러보는 사용자도 많아서,
// IssueOverviewPanel에서 next/dynamic으로 분리해 실제로 탭을 열 때만 이 청크를 받아오게 한다.
export function IssueBodyMarkdown({ body }: IssueBodyMarkdownProps) {
  // body(최대 수만 자)는 마운트 동안 안 바뀌는데, 상위 컴포넌트가 리렌더될 때마다 정규식
  // 치환을 다시 돌리지 않도록 body가 실제로 바뀔 때만 재계산한다.
  const markdown = useMemo(() => convertHtmlImgToMarkdown(body), [body])

  return (
    <div className="prose prose-sm dark:prose-invert min-w-0 max-w-none [overflow-wrap:anywhere] [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto">
      {/* GitHub이 이미지를 raw <img> 태그로 붙여넣는 경우 react-markdown이 무시해버리므로,
          렌더링 전에 마크다운 이미지 문법으로 바꿔둔다(rehype-raw로 임의 HTML을 다 열어주는 대신,
          이미지 태그만 좁게 변환 — sanitize 정책을 따로 관리할 필요가 없다). */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="max-w-full overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
