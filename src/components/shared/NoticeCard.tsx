import { Info, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type NoticeTone = 'info' | 'warning'

type NoticeCardProps = {
  children: ReactNode
  tone?: NoticeTone
  icon?: LucideIcon | null
  className?: string
}

const toneClassNames: Record<NoticeTone, { card: string; content: string }> = {
  info: {
    card: 'border-brand-subtle-border bg-brand-subtle',
    content: 'text-brand-subtle-foreground',
  },
  warning: {
    card: 'border-status-warning-border bg-status-warning',
    content: 'text-status-warning-foreground',
  },
}

export function NoticeCard({
  children,
  tone = 'info',
  icon: Icon = Info,
  className,
}: NoticeCardProps) {
  const toneClassName = toneClassNames[tone]

  return (
    <Card
      size="sm"
      className={cn('border py-3', toneClassName.card, className)}
    >
      <CardContent className={cn('flex items-start gap-2', toneClassName.content)}>
        {Icon ? <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : null}
        <p className="text-xs leading-5">{children}</p>
      </CardContent>
    </Card>
  )
}
