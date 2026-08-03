import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type CardListErrorProps = {
  message: string
  onRetry?: () => void
  variant?: 'danger' | 'warning'
}

const VARIANT_CLASSES = {
  danger: {
    card: 'border-status-danger-border bg-status-danger',
    text: 'text-status-danger-foreground',
    button: 'border-status-danger-border bg-background',
  },
  warning: {
    card: 'border-status-warning-border bg-status-warning',
    text: 'text-status-warning-foreground',
    button: 'border-status-warning-border bg-background',
  },
} as const

export function CardListError({ message, onRetry, variant = 'danger' }: CardListErrorProps) {
  const classes = VARIANT_CLASSES[variant]

  return (
    <Card className={`border py-8 text-center ${classes.card}`}>
      <CardContent className="flex flex-col items-center gap-3">
        <p className={`text-sm font-medium ${classes.text}`}>{message}</p>
        {onRetry ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className={classes.button}
            >
              다시 시도
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
