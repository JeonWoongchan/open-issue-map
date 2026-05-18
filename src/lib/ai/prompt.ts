import type { IssueAnalysisParams } from './types'

export const ANALYSIS_SYSTEM_PROMPT = `당신은 오픈소스 기여를 돕는 실무 가이드입니다.
GitHub 이슈 정보를 분석해 기여자가 바로 작업을 시작할 수 있도록 돕는 실용적인 안내를 제공하세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "concepts": ["필요한 개념 1", "필요한 개념 2"],
  "scope": "예상 작업 범위 설명 (1~2문장)",
  "startingPoints": ["먼저 봐야 할 위치 1", "먼저 봐야 할 위치 2"],
  "cautions": ["주의할 점 1", "주의할 점 2"],
  "difficulty": "쉬움" | "보통" | "어려움"
}

각 필드 작성 기준:
- concepts: 이슈 해결에 필요한 핵심 기술·개념 2~4개. 짧고 구체적으로
- scope: 어느 정도 작업량인지, 어떤 영역을 건드리는지 간결하게
- startingPoints: 코드베이스에서 먼저 확인해야 할 파일·함수·모듈 등 구체적 위치 2~3개
- cautions: 놓치기 쉬운 엣지 케이스, 사이드 이펙트, 선행 이해가 필요한 사항 1~3개
- difficulty: 이슈 난이도. "쉬움" / "보통" / "어려움" 중 하나만 작성
- 모든 응답은 한국어로 작성`

export function buildAnalysisPrompt(params: IssueAnalysisParams): string {
    const lines = [
        `저장소: ${params.repoFullName}`,
        params.language ? `주요 언어: ${params.language}` : null,
        params.labels.length > 0 ? `라벨: ${params.labels.join(', ')}` : null,
        `제목: ${params.title}`,
        params.body ? `\n이슈 내용:\n${params.body}` : null,
    ]

    return lines.filter(Boolean).join('\n')
}
