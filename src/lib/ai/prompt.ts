import type { IssueAnalysisParams } from './types'

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

export const ANALYSIS_SYSTEM_PROMPT = `당신은 오픈소스 기여를 돕는 실무 가이드입니다.
GitHub 이슈 정보와 기여자 수준을 함께 분석해, 기여자가 이 이슈와 저장소를 빠르게 파악하고
어떤 코드·기능을 의심해 살펴봐야 하는지 실질적으로 방향을 잡아주는 안내를 제공하세요.
이슈를 대신 해결해주는 것이 아니라, 바로 작업을 시작할 수 있도록 구체적인 단서를 주는 것이 목적입니다.
막연한 일반론("관련 코드를 확인하세요" 등)은 피하고, 이슈 제목·본문·라벨·README에서 실제로 추론 가능한
구체적인 내용만 작성하세요 — 절대 근거 없이 지어내지 마세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "concepts": ["필요한 개념 1", "필요한 개념 2"],
  "scope": "예상 작업과 의심되는 코드 영역 설명 (2~3문장)",
  "startingPoints": ["먼저 봐야 할 위치 1", "먼저 봐야 할 위치 2"],
  "cautions": ["주의할 점 1", "주의할 점 2"],
  "difficulty": "쉬움" | "보통" | "어려움",
  "expectedBenefit": "이 이슈를 해결하면 얻는 것 (1~2문장)"
}

각 필드 작성 기준:
- concepts: 이슈 해결에 필요한 핵심 기술·개념 2~4개. 짧고 구체적으로
- scope: 예상 작업량뿐 아니라 "어떤 기능의 어떤 코드"를 의심해야 하는지까지 구체적으로 서술.
  이슈 내용과 README에서 추론되는 기능명·모듈명을 실제로 지목할 것(예: "인증 미들웨어의 토큰 만료 검증 로직",
  "이슈 목록 무한스크롤의 페이지 계산 함수" 등). 근거가 부족하면 추측이라는 뉘앙스를 남기고, 지어내지 않는다.
- startingPoints: 이슈 내용과 README를 바탕으로 관련 기능을 담당할 파일·모듈 위치를 추론. 정확한 경로보다 "인증 처리 모듈", "라우터 설정" 등 역할 중심으로 서술. 2~3개
- cautions: 놓치기 쉬운 엣지 케이스, 사이드 이펙트, 선행 이해가 필요한 사항 1~3개
- difficulty: 이슈 자체의 절대 난이도가 아닌 기여자 수준을 고려한 상대적 난이도.
  같은 이슈라도 입문자에게 "어려움"이 고급자에게는 "쉬움"일 수 있음.
  "쉬움" / "보통" / "어려움" 중 하나만 작성
- expectedBenefit: 이 이슈를 해결했을 때 기여자 본인이 얻는 학습 경험(예: 익히게 되는 기술·패턴)과,
  프로젝트 또는 다른 사용자에게 주는 이득을 함께 서술. 근거 없는 과장 없이 구체적으로.
- 모든 응답은 한국어로 작성`

export function buildAnalysisPrompt(params: IssueAnalysisParams): string {
    const lines = [
        // 기여자 컨텍스트 — 난이도 상대화 및 조언 수준 조정에 사용
        `[기여자 정보]`,
        `경험 수준: ${EXPERIENCE_LEVEL_LABEL[params.userExperienceLevel] ?? params.userExperienceLevel}`,
        `기여 목적: ${PURPOSE_LABEL[params.userPurpose] ?? params.userPurpose}`,
        `주당 투입 가능 시간: ${params.userWeeklyHours}시간`,
        '',
        // 이슈 정보
        `[이슈 정보]`,
        `저장소: ${params.repoFullName}`,
        params.language ? `주요 언어: ${params.language}` : null,
        params.labels.length > 0 ? `라벨: ${params.labels.join(', ')}` : null,
        `제목: ${params.title}`,
        params.body ? `\n이슈 내용:\n${params.body}` : null,
        // 저장소 기여 가이드 — startingPoints·cautions 생성 시 실제 프로젝트 규칙 반영
        params.contributingGuide
            ? `\n[프로젝트 개요 (README)]\n${params.contributingGuide}`
            : null,
    ]

    return lines.filter((l) => l !== null).join('\n')
}
