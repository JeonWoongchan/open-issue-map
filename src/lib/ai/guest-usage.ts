import sql from '@/lib/db'
import { AI_GUEST_DAILY_LIMIT } from '@/constants/ai-limits'

type GuestUsageResult = {
    allowed: boolean
    remaining: number
}

/**
 * 비로그인 사용자의 IP별 AI 분석 사용 횟수를 확인하고 증가시킨다.
 *
 * - 만료된 레코드는 요청마다 피기백 방식으로 삭제해 DB를 자동 정리한다.
 * - SELECT → UPDATE 분리 방식의 race condition을 방지하기 위해 단일 UPSERT로 처리한다.
 *   ON CONFLICT DO UPDATE WHERE: 한도 미달일 때만 count를 증가시키고 RETURNING으로 결과를 반환한다.
 *   한도 초과 시 WHERE 조건이 거짓이 되어 UPDATE가 실행되지 않고 RETURNING이 비어 반환된다.
 * - 'unknown' IP는 공유 버킷으로 처리해 헤더 부재 우회 경로를 차단한다.
 */
export async function checkAndIncrementGuestUsage(ip: string): Promise<GuestUsageResult> {
    // 만료된 레코드 일괄 삭제 (24시간 경과 시 자동 초기화 효과)
    await sql`DELETE FROM ai_guest_usage WHERE expires_at < NOW()`

    // 단일 UPSERT로 조회와 증가를 원자적으로 처리
    // - 신규 IP: INSERT count=1 → RETURNING count=1
    // - 기존 IP, 한도 미달: UPDATE count+1 → RETURNING 새 count
    // - 기존 IP, 한도 초과: WHERE 조건 거짓 → UPDATE 미실행 → RETURNING 없음
    const rows = await sql<{ count: number }[]>`
        INSERT INTO ai_guest_usage (ip, count, expires_at)
        VALUES (${ip}, 1, NOW() + INTERVAL '24 hours')
        ON CONFLICT (ip) DO UPDATE
            SET count = ai_guest_usage.count + 1
            WHERE ai_guest_usage.count < ${AI_GUEST_DAILY_LIMIT}
        RETURNING count
    `

    if (rows.length === 0) {
        return { allowed: false, remaining: 0 }
    }

    const newCount = rows[0].count
    return {
        allowed: true,
        remaining: AI_GUEST_DAILY_LIMIT - newCount,
    }
}
