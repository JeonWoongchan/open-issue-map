# DB Schema

현재 DB schema는 마이그레이션 파일 기준이다. DB는 Neon PostgreSQL을 사용한다.

- `001_initial.sql`: users, user_profiles, bookmarks
- `002_ai_guest_usage.sql`: ai_guest_usage
- `003_onboarding_insight.sql`: onboarding_insights (`005`에서 제거됨)
- `004_recommendation_candidate_pools.sql`: recommendation_candidate_pools
- `005_onboarding_advice.sql`: onboarding_insights 제거, onboarding_advice 추가
- `006_issue_ai_guides.sql`: issue_ai_guides
- `007_bookmark_issue_snapshot.sql`: bookmarks에 이슈 카드 스냅샷 컬럼 추가
- `008_issue_ai_guide_prompt_version.sql`: issue_ai_guides에 prompt_version 추가

## `users`

GitHub OAuth 사용자의 기본 계정 정보다.

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `id` | `UUID` | PK, default `gen_random_uuid()` | 내부 user id |
| `github_id` | `TEXT` | NOT NULL, UNIQUE | GitHub profile id. 앱의 사용자 식별 기준 |
| `github_login` | `TEXT` | NOT NULL | GitHub username |
| `avatar_url` | `TEXT` | nullable | GitHub avatar URL |
| `created_at` | `TIMESTAMPTZ` | default `NOW()` | 최초 저장 시각 |

생성/갱신 위치:

- `src/lib/auth.ts`의 NextAuth `jwt` callback
- 로그인 최초 시점에 upsert

## `user_profiles`

온보딩 설문 결과와 추천 기준이다.

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `id` | `UUID` | PK | profile id |
| `user_id` | `UUID` | FK -> `users(id)`, ON DELETE CASCADE, UNIQUE | 사용자 |
| `top_languages` | `TEXT[]` | nullable | 선호/추출 언어 |
| `experience_level` | `TEXT` | nullable | `beginner | junior | mid | senior` |
| `contribution_types` | `TEXT[]` | nullable | `doc | bug | feat | test | review` |
| `weekly_hours` | `INT` | nullable | `2 | 5 | 10` |
| `purpose` | `TEXT` | nullable | `portfolio | growth | community` |
| `onboarding_done` | `BOOLEAN` | default `FALSE` | 온보딩 완료 여부 |
| `updated_at` | `TIMESTAMPTZ` | default `NOW()` | 마지막 수정 시각 |

사용 위치:

- 저장: `src/lib/user/onboarding.ts`
- 조회: `src/lib/user/profile.ts`, `src/lib/user/my-page.ts`
- 메인 layout 보호: `getOnboardingStatus()`
- 추천 이슈: `loadOnboardingProfile()`

## `onboarding_advice`

온보딩 조합(기여방식 × 목적)별로 미리 써둔 정적 조언 문장 풀이다. AI 호출 없이 대시보드 리포트 카드가 읽기만 한다.

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `contribution_type` | `TEXT` | PK(복합) | `doc \| bug \| feat \| test \| review` 중 하나 |
| `purpose` | `TEXT` | PK(복합) | `portfolio \| growth \| community` 중 하나 |
| `sentences` | `JSONB` | NOT NULL | 조언 문자열 배열(조합당 5개) |

동작 방식:

- `contribution_type`은 다중 선택인 온보딩 응답 중 하나를 무작위로 골라 매칭한다(`getOnboardingAdvice`).
- 대시보드는 매칭된 5개 문장 중 하나를 매 렌더마다 무작위로 골라 보여준다 — 새로고침할 때마다 다른 문구가 노출된다.
- 문구 내용은 코드 배포 없이 DB 값만 갱신하면 바뀐다.
- 이전에는 온보딩 제출 시 AI(Gemini)로 문구를 생성해 사용자당 캐싱하는 `onboarding_insights` 테이블을 썼으나, AI 비용·지연·실패 재시도 로직을 없애기 위해 정적 문구 풀로 교체했다(`005_onboarding_advice.sql`에서 `onboarding_insights` 삭제).

사용 위치:

- 조회: `src/lib/user/onboarding-advice.ts`의 `getOnboardingAdvice()`
- 표시: `src/app/(dashboard)/dashboard/page.tsx` → `DashboardReportCard`

## `recommendation_candidate_pools`

언어 × 조건(latest/popular)별로 GitHub Actions 스케줄러가 미리 적재해둔 추천 이슈 후보 풀이다. 대시보드 요청 경로는 GitHub를 직접 호출하지 않고 이 테이블만 읽는다.

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `language` | `TEXT` | PK(복합) | `POPULAR_LANGUAGES` 중 하나 |
| `condition` | `TEXT` | PK(복합) | `latest \| popular` |
| `payload` | `JSONB` | NOT NULL | 후보 이슈(`RawIssue[]`) |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | 마지막 갱신 시각 |

동작 방식:

- 갱신: `.github/workflows/refresh-recommendation-pool.yml`이 언어별로 `/api/cron/refresh-recommendation-pool`을 호출 → `refreshCandidatePool()`이 GitHub에서 가져와 통째로 upsert.
- 조회: `fetchRecommendedIssues()`가 프로필의 언어들을 한 번의 쿼리(`getCandidatePools`, `WHERE language = ANY(...)`)로 읽어 합친 뒤 랭킹/캡/샘플링을 요청 시점에 수행한다.

사용 위치:

- `src/lib/github/issues/candidate-pool-store.ts`
- `src/lib/github/issues/recommendations.ts`
- `src/app/api/cron/refresh-recommendation-pool/route.ts`

## `bookmarks`

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `id` | `UUID` | PK | bookmark id |
| `user_id` | `UUID` | FK -> `users(id)`, ON DELETE CASCADE | 사용자 |
| `issue_number` | `INT` | NOT NULL | GitHub issue number |
| `repo_full_name` | `TEXT` | NOT NULL | `owner/repo` |
| `issue_title` | `TEXT` | NOT NULL | 저장 시점 issue title |
| `issue_url` | `TEXT` | NOT NULL | GitHub issue URL |
| `repo_url` | `TEXT` | nullable | 저장 시점 저장소 URL |
| `language` | `TEXT` | nullable | 저장 시점 저장소 주 언어 |
| `stargazer_count` | `INT` | nullable | 저장 시점 저장소 star 수 |
| `labels` | `TEXT[]` | nullable | 저장 시점 이슈 라벨 |
| `comment_count` | `INT` | nullable | 저장 시점 댓글 수 |
| `issue_body` | `TEXT` | nullable | 저장 시점 이슈 본문 미리보기 |
| `issue_created_at` | `TIMESTAMPTZ` | nullable | GitHub 이슈 생성 시각 |
| `issue_updated_at` | `TIMESTAMPTZ` | nullable | 저장 시점 GitHub 이슈 수정 시각 |
| `score` | `INT` | nullable | 저장 시점 추천 점수 |
| `difficulty_level` | `TEXT` | nullable | 저장 시점 난이도 추정값 |
| `contribution_type` | `TEXT` | nullable | 추정 기여 유형 |
| `competition_level` | `TEXT` | nullable | 저장 시점 경쟁도 추정값 |
| `has_pr` | `BOOLEAN` | NOT NULL default `false` | 저장 시점 PR 연결 여부 |
| `repo_activity_level` | `TEXT` | nullable | 저장 시점 저장소 활동성 추정값 |
| `created_at` | `TIMESTAMPTZ` | default `NOW()` | 북마크 생성 시각 |
| `updated_at` | `TIMESTAMPTZ` | default `NOW()` | 북마크 수정 시각 |

제약:

- `UNIQUE(user_id, repo_full_name, issue_number)`

인덱스:

- `idx_bookmarks_user_id` on `bookmarks(user_id)`

사용 위치:

- `src/lib/bookmarks.ts`
- `src/lib/bookmark-list.ts`
- `src/app/api/bookmarks/route.ts`
- `src/lib/user/my-page.ts`의 activity count

## `issue_ai_guides`

사용자·이슈별 AI 가이드 응답 캐시다. 로그인 사용자는 GitHub ID를, 비로그인 사용자는 공용 `guest` 값을 `cache_user_id`로 사용한다.

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `cache_user_id` | `TEXT` | PK(복합) | 로그인 사용자 GitHub ID 또는 `guest` |
| `repo_full_name` | `TEXT` | PK(복합) | `owner/repo` |
| `issue_number` | `INT` | PK(복합) | GitHub issue number |
| `issue_updated_at` | `TIMESTAMPTZ` | NOT NULL | 분석 당시 GitHub 이슈 수정 시각 |
| `prompt_version` | `TEXT` | NOT NULL, default `legacy` | 분석에 사용한 프롬프트 버전 |
| `analysis` | `JSONB` | NOT NULL | Zod 스키마로 검증된 AI 가이드 응답 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | 마지막 생성 시각 |

캐시 히트 조건:

- 복합 키 `(cache_user_id, repo_full_name, issue_number)`가 일치한다.
- `issue_updated_at`이 현재 GitHub 이슈의 `updatedAt`과 같다.
- `prompt_version`이 현재 코드의 `ANALYSIS_PROMPT_VERSION`과 같다.
- 생성 후 60일이 지나지 않았고 저장된 JSON이 현재 응답 스키마 검증을 통과한다.

`008` 적용 전 기존 행은 `prompt_version = 'legacy'`로 표시된다. 따라서 새 프롬프트 버전 조회에서는 캐시 미스로 처리되고 다음 생성 시 현재 버전으로 갱신된다.

사용 위치:

- `src/lib/ai/issue-guide-cache.ts`
- `src/app/api/ai/issue-analysis/route.ts`

## `ai_guest_usage`

비로그인 사용자의 AI 분석 일일 사용 횟수를 IP 기반으로 관리한다.

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `ip` | `TEXT` | PK | 클라이언트 IP (`x-real-ip` 우선, 없으면 `x-forwarded-for` 첫 번째 값) |
| `count` | `INT` | NOT NULL, default `1` | 오늘 사용 횟수 |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW() + 24h` | 레코드 만료 시각 |

동작 방식:

- `expires_at < NOW()`인 레코드는 유효하지 않은 것으로 간주한다.
- 실제 삭제는 별도 스케줄러 없이 **피기백 방식**으로 처리한다. AI 분석 요청마다 `DELETE WHERE expires_at < NOW()`를 실행해 만료 행을 자동 정리한다.
- 한도(`AI_GUEST_DAILY_LIMIT = 3`) 초과 시 `429 RATE_LIMITED`를 반환한다.
- IP 식별 헤더가 없으면 `unknown` 공유 버킷으로 집계해 헤더 부재를 통한 우회를 막는다.

사용 위치:

- `src/lib/ai/guest-usage.ts`의 `checkAndIncrementGuestUsage()`
- `src/app/api/ai/issue-analysis/route.ts` — 비로그인 요청 진입점
- 관련 상수: `src/constants/ai-limits.ts`

## 관계

```text
users 1 ── 0..1 user_profiles
users 1 ── 0..N bookmarks
ai_guest_usage는 비로그인 IP 기준 독립 임시 테이블 (users와 무관)
onboarding_advice는 (기여방식, 목적) 조합 기준 독립 정적 콘텐츠 (users와 무관)
recommendation_candidate_pools는 (언어, 조건) 조합 기준 독립 캐시 (users와 무관)
issue_ai_guides는 사용자 식별값과 GitHub 이슈 조합 기준 독립 캐시
```

## 운영 메모

- `github_id`는 앱 사용자 식별 기준이다. GitHub login은 바뀔 수 있으므로 primary key로 쓰지 않는다.
- `bookmarks`는 저장 시점 이슈 카드 데이터 전체를 스냅샷으로 들고 있다 — 목록 조회 시 GitHub을 다시 조회하지 않으므로, 점수·PR연결여부 등은 북마크 시점 값으로 고정된다(007 마이그레이션 이전 행은 스냅샷 컬럼이 NULL).
- 대규모 트래픽이 생기면 bookmark 목록 조회의 정렬 조건과 count 비용을 먼저 확인한다.
- AI 프롬프트의 응답 내용이나 문체를 바꾸면 `ANALYSIS_PROMPT_VERSION`도 함께 올린다.
