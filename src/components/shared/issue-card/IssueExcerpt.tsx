import { stripMarkdownPreview } from '@/utils/format/strip-markdown-preview'

type IssueExcerptProps = {
  body: string | null | undefined
}

export function IssueExcerpt({ body }: IssueExcerptProps) {
  const preview = body ? stripMarkdownPreview(body) : null
  if (!preview) return null

  return <p className="line-clamp-2 text-xs text-muted-foreground">{preview}</p>
}
