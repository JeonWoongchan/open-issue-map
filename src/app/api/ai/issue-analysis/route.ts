import { auth } from '@/lib/auth'
import { err, ErrorCode, ok } from '@/lib/api-response'
import { createAiProvider } from '@/lib/ai'
import { issueAnalysisRequestSchema } from '@/lib/validators/ai'

export async function POST(req: Request) {
    // 비로그인 사용자 차단 — AI 기능은 로그인 필수
    const session = await auth()
    if (!session) return err('Unauthorized', 401, ErrorCode.UNAUTHORIZED)

    // 요청 본문 파싱 및 검증
    const body = (await req.json().catch(() => null)) as unknown
    const parsed = issueAnalysisRequestSchema.safeParse(body)
    if (!parsed.success) {
        return err('Invalid request payload', 400, ErrorCode.INVALID_REQUEST)
    }

    // GEMINI_API_KEY 미설정 시 기능 비활성화
    if (!process.env.GEMINI_API_KEY) {
        return err('AI 분석 기능을 사용할 수 없습니다.', 503, ErrorCode.INTERNAL_ERROR)
    }

    try {
        const provider = createAiProvider()
        const analysis = await provider.analyzeIssue(parsed.data)
        return ok(analysis)
    } catch (error) {
        console.error('[POST /api/ai/issue-analysis] AI 분석 실패:', error)
        return err('AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.', 500, ErrorCode.INTERNAL_ERROR)
    }
}
