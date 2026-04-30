import { WEEKLY_HOURS } from '@/constants/contribution-levels'
import { OptionCard } from '../OptionCard'
import { StepSection } from '../StepSection'
import type { WeeklyHours } from '@/types/user'

type WeeklyHoursStepProps = {
  value: WeeklyHours | null
  onChangeAction: (value: WeeklyHours) => void
}

export function WeeklyHoursStep({ value, onChangeAction }: WeeklyHoursStepProps) {
  return (
    <StepSection
      title="매주 어느 정도 시간을 쓸 수 있나요?"
      description="투입 가능한 시간을 알면 부담 없이 이어갈 수 있는 이슈를 추천할 수 있어요."
    >
      {WEEKLY_HOURS.map((item) => (
        <OptionCard
          key={item.value}
          label={item.label}
          description={item.description}
          selected={value === item.value}
          onClick={() => onChangeAction(item.value)}
        />
      ))}
    </StepSection>
  )
}
