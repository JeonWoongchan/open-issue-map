'use server'

import { revalidateTag } from 'next/cache'
import type { RecommendationCondition } from '@/constants/recommendation'
import { auth } from '@/lib/auth'
import { buildRecommendationCacheTag } from '@/lib/github/issues/recommendations'

// 레일별 새로고침 버튼용 — 이 유저(게스트는 공유 캐시)의 이 조건(condition)에 해당하는
// 추천 이슈 서버 캐시만 무효화한다. 다른 레일의 캐시는 그대로 유지된다.
// 클라이언트가 준 userId를 믿지 않고 서버에서 직접 세션을 확인한다.
export async function refreshRecommendations(condition: RecommendationCondition) {
  const session = await auth()
  const cacheUserId = session?.user.id ?? 'guest'
  revalidateTag(buildRecommendationCacheTag(cacheUserId, condition))
}
