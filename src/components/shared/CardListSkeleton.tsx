import { Card, CardContent } from '@/components/ui/card'

type CardListSkeletonProps = {
  count?: number
}

const DEFAULT_COUNT = 4

export function CardListSkeleton({
  count = DEFAULT_COUNT,
}: CardListSkeletonProps) {
  return (
    <div className={'grid gap-4 sm:grid-cols-2'}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} size="sm" className="border border-border py-4">
          <CardContent className="animate-pulse space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-28 rounded bg-skeleton" />
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
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-skeleton" />
              <div className="h-3 w-3/5 rounded bg-skeleton" />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
              <div className="flex gap-3">
                <div className="h-3 w-10 rounded bg-skeleton" />
                <div className="h-3 w-8 rounded bg-skeleton" />
              </div>
              <div className="h-6 w-6 rounded-md bg-skeleton" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
