import { Separator } from '@/components/ui/separator'

type SectionHeadingProps = {
  title: string
}

export function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <Separator />
    </div>
  )
}
