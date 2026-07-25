import type { OnboardingInsightParams } from './types'

const EXPERIENCE_LEVEL_LABEL: Record<string, string> = {
    beginner: '입문 (처음 오픈소스 기여)',
    junior:   '초급 (간단한 버그·문서 경험 있음)',
    mid:      '중급 (기능 추가·리팩토링 경험 있음)',
    senior:   '고급 (대규모 변경·설계 경험 있음)',
}

const PURPOSE_LABEL: Record<string, string> = {
    portfolio: '포트폴리오 구축',
    growth:    '실력 향상',
    community: '커뮤니티 기여',
}

const CONTRIBUTION_TYPE_LABEL: Record<string, string> = {
    doc: '문서', bug: '버그 수정', feat: '기능 개발', test: '테스트', review: '리뷰',
}

export const ONBOARDING_INSIGHT_SYSTEM_PROMPT = `당신은 오픈소스 기여를 시작하려는 개발자에게 조언하는 커리어 코치입니다.
사용자가 온보딩 설문에서 선택한 조합(경험 수준·선호 언어·기여 방식·주간 시간·목적)을 보고, 짧고 실용적인 조언을 제공하세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "adviceItems": ["조언 1", "조언 2", "조언 3"]
}

작성 기준:
- adviceItems는 2~4개, 각 항목은 1~2문장으로 짧게
- 이 조합을 선택한 사람들의 일반적인 경향, 다른 선택을 한 사람들과 비교했을 때 도움이 되는 관점, 최근 채용·개발 시장에서 중요해지는 능력 중 서로 다른 각도를 섞어서 작성
- 매우 중요: "이 서비스를 쓰는 사용자들은…" 같은 표현은 절대 쓰지 마세요. 이 서비스의 실제 사용자 통계를 아는 것처럼 말하면 안 됩니다. "보통 ~한 경우가 많다", "~인 분들도 있는데" 같은 표현은 어디까지나 개발 업계 전반에 대한 일반적인 지식으로만 서술하고, 없는 통계를 지어내지 마세요.
- 존댓말, 친근하되 근거 없는 확언은 피하고 개연성 있게 서술
- 모든 응답은 한국어로 작성`

export function buildOnboardingInsightPrompt(params: OnboardingInsightParams): string {
    const lines = [
        `경험 수준: ${EXPERIENCE_LEVEL_LABEL[params.experienceLevel] ?? params.experienceLevel}`,
        `선호 언어: ${params.topLanguages.join(', ') || '미지정'}`,
        `기여 방식: ${params.contributionTypes.map((t) => CONTRIBUTION_TYPE_LABEL[t] ?? t).join(', ') || '미지정'}`,
        `주당 투입 가능 시간: ${params.weeklyHours}시간`,
        `기여 목적: ${PURPOSE_LABEL[params.purpose] ?? params.purpose}`,
    ]

    return lines.join('\n')
}
