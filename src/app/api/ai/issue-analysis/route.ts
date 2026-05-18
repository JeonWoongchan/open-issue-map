import { auth } from '@/lib/auth'
import { err, ErrorCode, ok } from '@/lib/api-response'
import { createAiProvider } from '@/lib/ai'
import { issueAnalysisRequestSchema } from '@/lib/validators/ai'
import { checkAndIncrementGuestUsage } from '@/lib/ai/guest-usage'

// x-real-ip를 우선한다 — Vercel이 직접 주입하며 클라이언트가 조작할 수 없다.
// x-forwarded-for는 클라이언트가 최초값을 임의로 설정할 수 있어 신뢰도가 낮다.
// 두 헤더 모두 없으면 'unknown' 공유 버킷을 사용한다 — IP null 우회 경로 방지.
function extractClientIp(req: Request): string {
    const realIp = req.headers.get('x-real-ip')
    if (realIp) return realIp.trim()
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return 'unknown'
}

export async function POST(req: Request) {
    const session = await auth()

    // 비로그인 사용자: IP 기반 일일 한도 체크
    if (!session) {
        const ip = extractClientIp(req)
        const { allowed } = await checkAndIncrementGuestUsage(ip)
        if (!allowed) {
            return err(
                '하루 무료 AI 분석 한도를 초과했습니다.',
                429,
                ErrorCode.RATE_LIMITED,
            )
        }
    }

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
