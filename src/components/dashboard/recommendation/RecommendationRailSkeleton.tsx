import { Card, CardContent } from '@/components/ui/card'

const SKELETON_CARD_COUNT = 4

export function RecommendationRailSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-20 animate-pulse rounded bg-skeleton" />
        <div className="h-4 w-40 animate-pulse rounded bg-skeleton" />
        <div className="h-3 w-64 animate-pulse rounded bg-skeleton" />
      </div>
      <div className="h-px w-full bg-border" />
      <div className="flex gap-3.5 overflow-hidden">
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
          <Card key={index} size="sm" className="w-[280px] shrink-0 border border-border py-4">
            <CardContent className="animate-pulse space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-24 rounded bg-skeleton" />
                  <div className="h-2 w-14 rounded bg-skeleton" />
                </div>
                <div className="h-9 w-9 shrink-0 rounded-full bg-skeleton" />
              </div>
              <div className="h-4 w-full rounded bg-skeleton" />
              <div className="h-4 w-4/5 rounded bg-skeleton" />
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-md bg-skeleton" />
                <div className="h-5 w-14 rounded-md bg-skeleton" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
