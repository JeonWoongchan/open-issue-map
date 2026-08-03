export default function IssueDetailLoading() {
  return (
    <div className="issue-detail-grid animate-pulse">
      <div className="issue-detail-grid__header flex flex-col gap-3">
        <div className="h-3 w-48 rounded bg-skeleton" />
        <div className="flex items-center gap-4">
          <div className="h-[60px] w-[60px] shrink-0 rounded-full bg-skeleton" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-5 w-3/4 rounded bg-skeleton" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-md bg-skeleton" />
              <div className="h-5 w-20 rounded-md bg-skeleton" />
            </div>
          </div>
        </div>
      </div>

      <div className="issue-detail-grid__callout h-20 rounded-lg bg-skeleton" />

      <div className="issue-detail-grid__sidebar">
        <div className="h-48 rounded-lg border border-border bg-skeleton" />
        <div className="h-32 rounded-lg border border-border bg-skeleton" />
      </div>

      <div className="issue-detail-grid__main">
        <div className="h-64 rounded-lg border border-border bg-skeleton" />
        <div className="h-64 rounded-lg border border-border bg-skeleton" />
      </div>
    </div>
  )
}
