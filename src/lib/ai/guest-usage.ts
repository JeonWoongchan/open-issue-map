import sql from '@/lib/db'
import { AI_GUEST_DAILY_LIMIT } from '@/constants/ai-limits'

type GuestUsageResult = {
    allowed: boolean
    remaining: number
}

/**
 * 비로그인 사용자의 IP별 AI 분석 사용 횟수를 확인하고 증가시킨다.
 *
 * - 만료 레코드는 요청마다 피기백 방식으로 삭제해 DB를 자동 정리한다.
 * - race condition 방지: 단일 UPSERT로 처리 — ON CONFLICT WHERE가 false이면
 *   UPDATE 미실행 → RETURNING 없음 → 한도 초과 판정.
 * - 'unknown' IP는 공유 버킷으로 처리해 헤더 부재 우회를 차단한다.
 */
export async function checkAndIncrementGuestUsage(ip: string): Promise<GuestUsageResult> {
    await sql`DELETE FROM ai_guest_usage WHERE expires_at < NOW()`

    const rows = (await sql`
        INSERT INTO ai_guest_usage (ip, count, expires_at)
        VALUES (${ip}, 1, NOW() + INTERVAL '24 hours')
        ON CONFLICT (ip) DO UPDATE
            SET count = ai_guest_usage.count + 1
            WHERE ai_guest_usage.count < ${AI_GUEST_DAILY_LIMIT}
        RETURNING count
    `) as { count: number }[]

    if (rows.length === 0) {
        return { allowed: false, remaining: 0 }
    }

    const newCount = rows[0].count
    return {
        allowed: true,
        remaining: AI_GUEST_DAILY_LIMIT - newCount,
    }
}
