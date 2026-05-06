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
            <div className="flex items-center justify-between gap-3">
              <div className="h-3 w-28 rounded bg-interactive-border/10" />
              <div className="h-5 w-12 rounded-md bg-interactive-action" />
            </div>
            <div className="h-4 w-full rounded bg-interactive-border/50" />
            <div className="h-4 w-4/5 rounded bg-interactive-border/50" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-md bg-interactive-border/50" />
              <div className="h-5 w-14 rounded-md bg-interactive-border/50" />
            </div>
            <div className="flex gap-2 pt-4">
              <div className="h-3 w-12 rounded bg-interactive-border/50" />
              <div className="h-3 w-10 rounded bg-interactive-border/50" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
