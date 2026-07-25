import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { CardVariant } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { updateSpotlightPosition } from '@/utils/dom/card-spotlight'

type CardShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  variant?: CardVariant
}

export function CardShell({ children, className, contentClassName, variant = 'default' }: CardShellProps) {
  return (
    <Card
      size="sm"
      variant={variant}
      className={cn('h-full border border-border py-4', className)}
      onMouseMove={variant === 'interactive' ? updateSpotlightPosition : undefined}
    >
      <CardContent className={cn('relative flex h-full flex-col gap-3', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
