import { Badge } from '@/components/ui/badge'
import { CardTagsRow } from '@/components/shared/card/CardTagsRow'
import { DIFFICULTY_LABELS_KO } from '@/lib/github/issues/badge-meta'
import { getLanguageColor } from '@/lib/github/language-colors'
import type { DifficultyLevel } from '@/types/issue'

type IssueTagListProps = {
  difficultyLevel: DifficultyLevel | null
  labels: readonly string[]
  language: string | null
}

export function IssueTagList({ difficultyLevel, labels, language }: IssueTagListProps) {
  return (
    <CardTagsRow>
      {language && (
        <Badge
          variant="outline"
          className="rounded-md border-interactive-selected-border bg-interactive-selected text-interactive-selected-foreground"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: getLanguageColor(language) }}
          />
          {language}
        </Badge>
      )}
      {difficultyLevel && (
        <Badge variant="secondary" className="rounded-md">
          {DIFFICULTY_LABELS_KO[difficultyLevel]}
        </Badge>
      )}
      {labels.slice(0, 2).map((label) => (
        <Badge key={label} variant="outline" className="rounded-md text-muted-foreground">
          {label}
        </Badge>
      ))}
    </CardTagsRow>
  )
}
