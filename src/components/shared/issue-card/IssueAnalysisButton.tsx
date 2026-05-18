import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type IssueAnalysisButtonProps = {
  onClick: () => void
  className?: string
}

export function IssueAnalysisButton({ onClick, className }: IssueAnalysisButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('h-6 gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground', className)}
      onClick={onClick}
    >
      <Sparkles className="h-3 w-3" />
      AI 분석
    </Button>
  )
}
