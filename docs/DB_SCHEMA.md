# DB Schema

현재 DB schema는 `src/lib/db/migrations/001_initial.sql` 기준이다. DB는 Neon PostgreSQL을 사용한다.

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

## `bookmarks`

사용자가 저장한 이슈 정보다.

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `id` | `UUID` | PK | bookmark id |
| `user_id` | `UUID` | FK -> `users(id)`, ON DELETE CASCADE | 사용자 |
| `issue_number` | `INT` | NOT NULL | GitHub issue number |
| `repo_full_name` | `TEXT` | NOT NULL | `owner/repo` |
| `issue_title` | `TEXT` | NOT NULL | 저장 시점 issue title |
| `issue_url` | `TEXT` | NOT NULL | GitHub issue URL |
| `contribution_type` | `TEXT` | nullable | 추정 기여 유형 |
| `created_at` | `TIMESTAMPTZ` | default `NOW()` | 생성 시각 |
| `updated_at` | `TIMESTAMPTZ` | default `NOW()` | 수정 시각 |

제약:

- `UNIQUE(user_id, repo_full_name, issue_number)`

인덱스:

- `idx_bookmarks_user_id` on `bookmarks(user_id)`

사용 위치:

- `src/lib/bookmarks.ts`
- `src/lib/bookmark-list.ts`
- `src/app/api/bookmarks/route.ts`
- `src/lib/user/my-page.ts`의 activity count

## `repo_health_cache`

GitHub 저장소의 health score 캐시다.

| Column | Type | Constraint | 설명 |
| --- | --- | --- | --- |
| `id` | `UUID` | PK | cache id |
| `repo_full_name` | `TEXT` | NOT NULL, UNIQUE | `owner/repo` |
| `health_score` | `INT` | NOT NULL | 0~100 점수 |
| `avg_pr_response_days` | `FLOAT` | nullable | 현재 계산 결과에는 저장하지 않음 |
| `merge_rate` | `FLOAT` | nullable | 현재 계산 결과에는 저장하지 않음 |
| `last_commit_at` | `TIMESTAMPTZ` | nullable | 현재 계산 결과에는 저장하지 않음 |
| `cached_at` | `TIMESTAMPTZ` | default `NOW()` | 캐시 생성/갱신 시각 |

인덱스:

- `idx_repo_health_cache_cached_at` on `repo_health_cache(cached_at)`

사용 위치:

- `src/lib/github/repo-health/calculate.ts`
  - `getRepoHealth()`: 단건 조회 시 캐시 체크 → miss이면 GitHub API 호출 후 저장
  - `fetchAndCacheRepoHealth()`: 배치 조회 시 캐시 체크 없이 GitHub API 호출 후 저장 (배치 SELECT에서 이미 miss 확인)
- `src/lib/github/issues/health.ts`: `getRepoHealthMap()`이 배치 SELECT 후 미캐시 레포에 `fetchAndCacheRepoHealth()` 호출
- TTL: `REPO_HEALTH_CACHE_TTL_HOURS = 1`

## 관계

```text
users 1 ── 0..1 user_profiles
users 1 ── 0..N bookmarks
repo_health_cache는 GitHub repo_full_name 기준 독립 캐시
```

## 운영 메모

- `github_id`는 앱 사용자 식별 기준이다. GitHub login은 바뀔 수 있으므로 primary key로 쓰지 않는다.
- `bookmarks`는 저장 시점 title/url을 들고 있어 GitHub 조회 실패 시 fallback UI를 만들 수 있다.
- 대규모 트래픽이 생기면 bookmark 목록 조회의 정렬 조건과 count 비용을 먼저 확인한다.
- repo health 상세 metric 컬럼은 현재 nullable로 남아 있고, 실제 score만 저장한다.
