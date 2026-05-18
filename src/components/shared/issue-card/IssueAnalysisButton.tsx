import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

type IssueAnalysisButtonProps = {
  onClick: () => void
}

export function IssueAnalysisButton({ onClick }: IssueAnalysisButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-6 gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <Sparkles className="h-3 w-3" />
      AI 분석
    </Button>
  )
}
