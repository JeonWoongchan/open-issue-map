# API Contract

이 문서는 현재 `src/app/api/**/route.ts` 기준의 내부 API 계약이다. Open Issue Map의 API는 외부 공개 API가 아니라 서버와 클라이언트 사이의 BFF 역할을 한다.

## 공통 파일

- 응답 유틸: `src/lib/api-response.ts`
- 응답 타입: `src/types/api.ts`
- 클라이언트 fetch: `src/lib/fetch-api.ts`
- 클라이언트 인증 처리: `src/lib/client-auth.ts`
- GitHub 오류 매핑: `src/lib/github/error-response.ts`
- 입력 검증: `src/lib/validators/**`

## 공통 응답 형식

성공:

```json
{
  "ok": true,
  "data": {}
}
```

실패:

```json
{
  "ok": false,
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```

예외:

- `/api/auth/[...nextauth]`: NextAuth 기본 응답
- `/api/health`: 헬스체크 전용 응답

## Error Code

| Code | 의미 |
| --- | --- |
| `UNAUTHORIZED` | 로그인 세션 없음 또는 GitHub 인증 만료 |
| `NO_ACCESS_TOKEN` | 세션은 있으나 JWT에 GitHub access token 없음 |
| `RATE_LIMITED` | GitHub API rate limit — 단, `/api/ai/issue-analysis`에서는 게스트 AI 일일 한도 초과를 의미(원인이 다름에 유의) |
| `ONBOARDING_REQUIRED` | 온보딩 미완료 |
| `INVALID_REQUEST` | 요청 바디 스키마 검증 실패 |
| `INVALID_REPO` | 저장소 형식 오류 또는 찾을 수 없음 |
| `GITHUB_ERROR` | GitHub API 실패 |
| `INTERNAL_ERROR` | 서버 내부 실패 |

클라이언트는 `401 UNAUTHORIZED`와 `401 NO_ACCESS_TOKEN`을 받으면 `/login`으로 이동한다.

## 인증 규칙

### `auth()`

세션만 필요한 API에서 사용한다.

- `POST /api/onboarding`
- `POST /api/bookmarks`
- `DELETE /api/bookmarks`
- `GET /api/mypage`

### `requireGithubToken(req)`

GitHub access token이 필요한 API에서 사용한다.

- `GET /api/bookmarks`
- `GET /api/github/issues`
- `GET /api/github/pull-requests`
- `GET /api/github/profile`
- `GET /api/github/repo-health`
- `GET /api/mypage/activity`

## GitHub 오류 매핑

`githubGraphQL()`은 GitHub 오류를 다음 Error class로 변환한다.

- `GitHubUnauthorizedError`
- `GitHubRateLimitError`
- `GitHubNotFoundError`

Route Handler는 `getGitHubErrorResponse()`를 사용해 API 응답으로 변환한다.

| Error | API 응답 |
| --- | --- |
| `GitHubUnauthorizedError` | `401 UNAUTHORIZED` |
| `GitHubRateLimitError` | `429 RATE_LIMITED` |
| `GitHubNotFoundError` | notFound 설정이 있으면 `404 INVALID_REPO` |
| 기타 GitHub 오류 | 기본 `502 GITHUB_ERROR` 또는 route별 fallback |

일부 route는 DB 작업과 GitHub 작업이 섞여 있어 unknown error를 `500 INTERNAL_ERROR`로 처리한다.

## Endpoint Catalog

### `GET|POST /api/auth/[...nextauth]`

- 역할: NextAuth v5 handler
- 인증: NextAuth 내부 처리
- 공통 `ok`/`err` 형식 아님

### `GET /api/health`

- 역할: DB 연결 확인
- 인증: 없음
- 성공: `200 { status: "ok", db: "connected" }`
- 실패: `503 { status: "error", db: "disconnected" }`

### `POST /api/onboarding`

- 역할: 온보딩 설문 저장
- 인증: `auth()`
- Body:
  - `experienceLevel`: `beginner | junior | mid | senior`
  - `contributionTypes`: `doc | bug | feat | test | review` 배열
  - `topLanguages`: 문자열 배열
  - `weeklyHours`: `2 | 5 | 10`
  - `purpose`: `portfolio | growth | community`
- 성공: `200 { success: true }`
- 실패:
  - `401 UNAUTHORIZED`
  - `400 Invalid onboarding payload`
  - `500 INTERNAL_ERROR`

### `GET /api/mypage`

- 역할: 마이페이지 기본 프로필과 온보딩 요약 조회
- 인증: `auth()`
- 성공 data: `MyPageData`
- 실패:
  - `401 UNAUTHORIZED`
  - `500 INTERNAL_ERROR`
- 비고: DB 예외는 route-level `try/catch`로 구조화한다.

### `GET /api/mypage/activity`

- 역할: 북마크 수와 PR 활동 요약 조회
- 인증: `requireGithubToken()`
- 성공 data: `MyPageActivity`
- 실패:
  - `401 UNAUTHORIZED | NO_ACCESS_TOKEN`
  - `429 RATE_LIMITED`
  - `500 INTERNAL_ERROR`
- 비고: DB count와 GitHub PR 조회가 함께 실행된다. unknown error fallback은 `INTERNAL_ERROR`다.

### `GET /api/bookmarks`

- 역할: 사용자 북마크 이슈 목록 조회
- 인증: `requireGithubToken()`
- Query:
  - `limit`: 1~20, 기본 10
  - `offset`: 0 이상, 기본 0
- 성공 data: `BookmarkListPage`
- 실패:
  - `401 UNAUTHORIZED | NO_ACCESS_TOKEN`
  - `500 INTERNAL_ERROR`

### `POST /api/bookmarks`

- 역할: 이슈 북마크 저장
- 인증: `auth()`
- Body:
  - `issueNumber`: 양의 정수
  - `repoFullName`: 최대 200자
  - `issueTitle`: 최대 512자
  - `issueUrl`: URL, 최대 1024자
  - `contributionType`: optional
- 성공: `201 { saved: true }`
- 실패:
  - `401 UNAUTHORIZED`
  - `400 Invalid bookmark payload`
  - `500 INTERNAL_ERROR`

### `DELETE /api/bookmarks`

- 역할: 북마크 삭제
- 인증: `auth()`
- Body:
  - `issueNumber`: 양의 정수
  - `repoFullName`: 최대 200자
- 성공: `200 { deleted: true }`
- 실패:
  - `401 UNAUTHORIZED`
  - `400 Invalid bookmark payload`
  - `500 INTERNAL_ERROR`

### `GET /api/github/issues`

- 역할: 온보딩 프로필 기반 추천 이슈 조회
- 인증: `requireGithubToken()`
- Query:
  - `offset`: 0 이상, 기본 0
  - `batch`: 기본 `initial`
  - `language`
  - `difficultyLevel`
  - `contributionTypes` (복수 값 허용)
  - `minScore`: `SCORE_FILTER_THRESHOLDS` 허용값
  - `minStars`: `STAR_FILTER_THRESHOLDS` 허용값 (100 | 500 | 1000 | 5000)
- 성공 data: `IssueListPage`
  - `canLoadMoreCandidates: boolean`: 활성 필터로 결과가 부족해 자동 batch 교체가 중단됐을 때 `true`. 클라이언트는 이 값이 `true`이면 수동 "더 찾아보기" UI를 노출한다.
- 실패:
  - `401 UNAUTHORIZED | NO_ACCESS_TOKEN`
  - `400 ONBOARDING_REQUIRED`
  - `429 RATE_LIMITED`
  - `502 GITHUB_ERROR`
  - `500 INTERNAL_ERROR`

### `GET /api/github/pull-requests`

- 역할: 사용자 PR 이력 조회
- 인증: `requireGithubToken()`
- Query:
  - `offset`: 0 이상, 기본 0
  - `state`: `OPEN | MERGED | CLOSED`
- 성공 data: `PRListPage`
- 실패: `getGitHubErrorResponse()` 규칙 적용
- 비고: 본인 소유 저장소 PR은 제외한다.

### `GET /api/github/profile`

- 역할: GitHub 저장소 언어 집계
- 인증: `requireGithubToken()`
- 성공: `200 { topLanguages: string[] }`
- 실패: `getGitHubErrorResponse()` 규칙 적용

### `GET /api/github/repo-health`

- 역할: 저장소 health score 조회/계산
- 인증: `requireGithubToken()`
- Query:
  - `repo`: `owner/name`
- 성공: `200 { repo, healthScore }`
- 실패:
  - `400 INVALID_REPO`
  - `401 UNAUTHORIZED | NO_ACCESS_TOKEN`
  - `404 INVALID_REPO`
  - `429 RATE_LIMITED`
  - `500 INTERNAL_ERROR`

### `POST /api/ai/issue-analysis`

이슈 상세 페이지의 "개요"·"AI 가이드" 탭이 함께 쓰는 엔드포인트다. 이슈 하나당 Gemini를 한 번만 호출해서
4가지 결과(기여자 맞춤 가이드, 이슈 개요, 이슈 본문 요약, 기여 규칙 서술)를 하나의 JSON으로 묶어 반환한다 —
탭이 여러 개라도 클라이언트가 여러 번 요청하지 않는다.

- 역할: README·CONTRIBUTING.md 조회, DB 캐시 확인, Gemini 분석 요청까지 이 안에서 전부 처리하고 결과를 캐싱한다.
- 인증: 다른 엔드포인트의 `auth()`/`requireGithubToken()` 패턴과 다르다 — 세션이 없으면 서버 환경변수
  `GITHUB_TOKEN`으로 게스트를 허용하고(비로그인 접근 자체가 정상 흐름), 세션이 있으면 GitHub 연동 토큰
  (JWT의 `accessToken`)이 아직 유효한지만 게이트로 확인한다(README 조회 자체는 항상 서버 토큰을 쓰므로
  세션 토큰 값 자체는 이후 로직에서 쓰이지 않는다).
- Body (`issueAnalysisRequestSchema`):
  - `title`: 이슈 제목, 1~1000자
  - `body`: 이슈 본문, 최대 50000자, `null` 허용
  - `labels`: 라벨 배열, 최대 50개
  - `language`: 저장소 주요 언어, `null` 허용
  - `repoFullName`: `owner/repo` 형식(정규식 검증)
  - `issueNumber`: 양의 정수
  - `issueUpdatedAt`: GitHub 이슈의 `updatedAt` — 캐시 신선도 판별 기준(아래 참고)
- 캐싱 (`issue_ai_guides` 테이블):
  - 캐시 키는 `(cacheUserId, repoFullName, issueNumber)`. `cacheUserId`는 로그인 시 `user.id`, 게스트는
    모두 `'guest'` 한 키를 공유한다(첫 게스트 방문자만 실제 생성, 이후 게스트는 캐시로 즉시 응답).
  - 캐시 히트 조건은 저장 당시의 `issueUpdatedAt`과 지금 요청의 값이 **같을 때만**이다 — 이슈 제목·본문·
    라벨 수정이나 새 댓글 등으로 GitHub의 `updatedAt`이 바뀌면 자동으로 캐시 미스 처리된다(추가 API 호출 없이).
  - 위 조건과 별개로 생성된 지 60일이 지난 캐시는 방치된 것으로 보고 무시한다.
  - 응답 스키마가 바뀌어 예전 형태로 저장된 캐시 행이 있으면 zod 검증에서 걸러지고 캐시 미스로 처리돼
    자동으로 새 스키마로 재생성된다(수동 마이그레이션 불필요).
- 게스트 한도: 비로그인 사용자는 IP 기준 하루 `AI_GUEST_DAILY_LIMIT`(3회)까지만 실제 생성이 허용된다.
  **캐시 히트는 이 한도를 소모하지 않는다** — 실제로 Gemini를 호출할 때만 차감된다.
- 성공 data (`IssueAnalysis`):
  - `concepts: string[]` — 이슈 해결에 필요한 핵심 개념 2~4개
  - `scope: string` — 예상 작업 범위와 의심되는 코드 영역
  - `startingPoints: string[]` — 먼저 봐야 할 위치(정확한 경로가 아니라 역할 중심 서술)
  - `cautions: string[]` — 놓치기 쉬운 주의사항
  - `difficulty: "쉬움" | "보통" | "어려움"` — 절대 난이도가 아니라 기여자 프로필 대비 상대적 난이도
  - `expectedBenefit: string` — 이 이슈를 해결하면 얻는 것
  - `issueOverview.summary: string` — 이슈 한 줄 요약
  - `issueOverview.analysis: string` — 이슈 상세 해석 + 작성자가 정확히 어떤 도움을 원하는지 분석
  - `issueOverview.summarySections: { heading: string; items: string[] }[]` — 이슈 본문 전체를 원문
    섹션 구조(헤딩)를 살려 압축한 요약. **번역이 아니라 요약**이라 원문 길이에 출력이 비례하지 않는다.
  - `contributionGuideInsight.commitConventionNote: string` — 커밋 컨벤션 요구 여부에 대한 서술
  - `contributionGuideInsight.claNote: string` — CLA(기여자 라이선스 동의) 요구 여부에 대한 서술
  - `contributionRules.contributingGuidePath: string | null` — CONTRIBUTING.md 실제 경로. **AI가 아니라
    서버가 파일 존재로 결정론적으로 판별한 값**이다(찾지 못했으면 `null`)
  - `contributionRules.pullRequestTemplatePath: string | null` — PR 템플릿 실제 경로, 위와 동일하게 결정론적
- 실패:
  - `401 UNAUTHORIZED`: 비로그인 + 서버 `GITHUB_TOKEN` 미설정
  - `401 NO_ACCESS_TOKEN`: 로그인 세션은 있으나 GitHub 연동 토큰이 없거나 만료됨
  - `400 INVALID_REQUEST`: 요청 바디 스키마 검증 실패
  - `429 RATE_LIMITED`: 게스트 일일 한도(3회) 초과 — GitHub API 429와 코드는 같지만 원인은 게스트 한도 소진
  - `503 INTERNAL_ERROR`: `GEMINI_API_KEY` 미설정(AI 기능 자체가 비활성화된 상태)
  - `500 INTERNAL_ERROR`: Gemini 호출 실패 등 분석 생성 중 예외
- 비고: 캐시 미스 시 내부적으로 `getRepoReadme()`(README 원문, 24시간 캐시)와 `getContributionRules()`
  (CONTRIBUTING·PR 템플릿 경로/원문, 7일 캐시)를 병렬 조회해 Gemini 프롬프트 근거로 넣는다. 이 두 캐시는
  GitHub Contents API 호출이라 위의 `issue_ai_guides` DB 캐시와는 별개 계층이다.

## API 변경 체크리스트

1. 인증 방식 결정: `auth()` 또는 `requireGithubToken()`
2. 입력 검증 추가: Zod schema 또는 명시적 검증
3. 성공/실패 응답을 `ok()`/`err()`로 통일
4. `src/types/api.ts` 갱신
5. 클라이언트 훅이 `fetchApi<T>()` 또는 `isUnauthorizedApiResponse()`를 사용하는지 확인
6. GitHub 오류는 `getGitHubErrorResponse()`로 매핑
7. Route Handler 테스트 추가
8. 이 문서 갱신
