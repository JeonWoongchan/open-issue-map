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
| `RATE_LIMITED` | GitHub API rate limit |
| `ONBOARDING_REQUIRED` | 온보딩 미완료 |
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

## API 변경 체크리스트

1. 인증 방식 결정: `auth()` 또는 `requireGithubToken()`
2. 입력 검증 추가: Zod schema 또는 명시적 검증
3. 성공/실패 응답을 `ok()`/`err()`로 통일
4. `src/types/api.ts` 갱신
5. 클라이언트 훅이 `fetchApi<T>()` 또는 `isUnauthorizedApiResponse()`를 사용하는지 확인
6. GitHub 오류는 `getGitHubErrorResponse()`로 매핑
7. Route Handler 테스트 추가
8. 이 문서 갱신
