type IssueExcerptProps = {
  body: string | null | undefined
}

export function IssueExcerpt({ body }: IssueExcerptProps) {
  if (!body) return null

  return <p className="line-clamp-2 text-xs text-muted-foreground">{body}</p>
}
