# Folder Structure

현재 코드 기준 디렉터리 책임을 정리한다.

```text
src/
  app/
  components/
  constants/
  hooks/
  lib/
  types/
  utils/        ← format 유틸 (date, time-ago 등)
docs/
scripts/
public/
```

## `src/app`

Next.js App Router 엔트리다.

| 경로 | 책임 |
| --- | --- |
| `src/app/page.tsx` | 루트 redirect. 로그인/온보딩 상태에 따라 이동 |
| `src/app/layout.tsx` | 전역 HTML layout |
| `src/app/globals.css` | Tailwind v4 전역 스타일 |
| `src/app/(auth)/login/page.tsx` | GitHub 로그인 화면 |
| `src/app/onboarding/page.tsx` | 온보딩 서버 페이지 |
| `src/app/(main)/layout.tsx` | 메인 영역 인증/온보딩 보호, header, QueryProvider |
| `src/app/(main)/dashboard/page.tsx` | 추천 이슈 화면 |
| `src/app/(main)/bookmarks/page.tsx` | 북마크 화면 |
| `src/app/(main)/pr-history/page.tsx` | PR 이력 화면 |
| `src/app/(main)/profile/page.tsx` | 마이페이지 화면 |
| `src/app/api/**/route.ts` | 내부 BFF API |

## `src/app/api`

| API | 책임 |
| --- | --- |
| `auth/[...nextauth]` | NextAuth handler |
| `health` | DB 연결 헬스체크 |
| `onboarding` | 온보딩 설문 저장 |
| `bookmarks` | 북마크 목록/저장/삭제 |
| `github/issues` | 추천 이슈 목록 |
| `github/pull-requests` | 사용자 PR 이력 |
| `github/profile` | GitHub 언어 집계 |
| `github/repo-health` | 저장소 health score |
| `mypage` | 마이페이지 기본 데이터 |
| `mypage/activity` | 마이페이지 활동 통계 |

Route Handler의 상세 계약은 [API.md](./API.md)를 따른다.

## `src/components`

UI 컴포넌트 계층이다.

| 경로 | 책임 |
| --- | --- |
| `components/ui` | shadcn/ui 기반 primitive (Button, Card, Popover 등) |
| `components/layout` | header, avatar, shell |
| `components/shared` | 카드, 리스트 상태, 검색, issue card 공통 UI |
| `components/dashboard` | 추천 이슈 화면 컴포넌트 (필터, 카드, 수동 조회 안내 포함) |
| `components/bookmark` | 북마크 목록과 도움말 |
| `components/pr-history` | PR 이력 목록/카드/필터/도움말 |
| `components/mypage` | 프로필, 계정, 활동, 온보딩 요약 카드 |
| `components/onboarding` | 온보딩 wizard와 step |
| `components/help` | 공통 도움말 dialog 구성 |
| `components/providers` | React Query provider |

UI는 가능하면 도메인 로직을 직접 갖지 않고 hooks와 props를 통해 데이터를 받는다.

## `src/hooks`

클라이언트 상태와 API 호출을 담당한다.

| 파일 | 책임 |
| --- | --- |
| `useIssueList.ts` | 추천 이슈 infinite query. `hasNextPage`(자동)·`fetchMoreCandidatesAction`(수동) 분리 |
| `useIssueCandidateLoadMoreFeedback.ts` | 수동 추가 조회 피드백 상태. 빈 조회 횟수 추적 |
| `useIssueBookmarks.ts` | 이슈 북마크 낙관적 업데이트 mutation |
| `useBookmarkList.ts` | 북마크 목록 infinite query |
| `usePullRequestList.ts` | PR 이력 infinite query와 상태 필터 |
| `useMyPageData.ts` | 마이페이지 기본 데이터 query |
| `useMyPageActivity.ts` | 마이페이지 활동 query |
| `useOnboardingWizard.ts` | 온보딩 상태와 저장 |
| `useSearchFilter.ts` | 클라이언트 검색 필터 |
| `useScrollSentinel.ts` | 무한 스크롤 sentinel |
| `useHelpDialog.ts` | 도움말 dialog 상태 |
| `queryKeys.ts` | TanStack Query key와 공통 result 변환 |

## `src/lib`

서버/도메인 로직 계층이다.

| 경로 | 책임 |
| --- | --- |
| `auth.ts` | NextAuth 설정 |
| `auth-utils.ts` | Route Handler용 GitHub token 인증 |
| `api-response.ts` | `ok()`/`err()` 응답 유틸 |
| `client-auth.ts` | 클라이언트 401 판별과 로그인 redirect |
| `fetch-api.ts` | 공통 GET API fetch |
| `env.ts` | 필수 환경 변수 검증 |
| `db/index.ts` | Neon SQL client |
| `bookmarks.ts` | 북마크 DB primitive |
| `bookmark-list.ts` | 북마크 목록 카드 구성 |
| `user/**` | 온보딩, 프로필, 마이페이지 DB 로직 |
| `github/**` | GitHub API, 추천, PR, repo health |
| `validators/**` | Zod 입력 검증 |

## `src/lib/github`

| 경로 | 책임 |
| --- | --- |
| `client.ts` | GitHub GraphQL 공통 client와 오류 타입 |
| `error-response.ts` | GitHub 오류를 API 응답으로 변환 |
| `profile.ts` | GitHub REST 저장소 언어 집계 |
| `pull-requests.ts` | viewer PR 조회와 요약 |
| `batch.ts` | 추천 이슈 batch cursor encode/decode |
| `issues/search.ts` | GitHub issue search |
| `issues/service.ts` | 추천 이슈 page 구성 |
| `issues/ranking.ts` | 점수화 후 정렬 |
| `issues/scorer.ts` | 단일 이슈 점수 계산 |
| `issues/filters.ts` | API query 필터 파싱/적용. `hasActiveFilters()` 포함 |
| `issues/health.ts` | repo health map 조회 |
| `issues/bookmark.ts` | 북마크 이슈 GitHub 조회 |
| `repo-health/calculate.ts` | repo health score 계산/캐시. `getRepoHealth()`(단건, 캐시 체크 포함)와 `fetchAndCacheRepoHealth()`(배치용, 캐시 체크 없이 GitHub 호출+저장)로 분리 |

## `src/types`

공유 타입 정의다.

| 파일 | 책임 |
| --- | --- |
| `api.ts` | API 응답 data 타입 |
| `issue.ts` | RawIssue, ScoredIssue, IssueCardItem |
| `pull-request.ts` | PR GraphQL/raw/client 타입 |
| `user.ts` | 온보딩과 사용자 profile 타입 |
| `bookmark.ts` | Bookmark 타입 |
| `github.ts` | GitHub REST 응답 타입 |
| `next-auth.d.ts` | NextAuth session/JWT 확장 |
| `help.ts`, `onboarding.ts` | UI 구성 타입 |

## `src/utils`

순수 유틸 함수를 둔다.

| 경로 | 책임 |
| --- | --- |
| `utils/format/date.ts` | 날짜 포맷 |
| `utils/format/time-ago.ts` | 상대 시간 표시 |

## `src/constants`

도메인 상수와 도움말 data를 둔다.

- `scoring-rules.ts`: 추천 점수, cache TTL, GitHub timeout, repo health 규칙, `STAR_FILTER_THRESHOLDS`
- `contribution-levels.ts`: 온보딩 선택지
- `dashboard-help.ts`, `bookmark-help.ts`, `pr-history-help.ts`: 도움말 컨텐츠

## `scripts`

- `migrate.ts`: SQL migration 실행

## `docs`

프로젝트 운영 문서다. 현재 공개 가능한 `.md` 문서는 Git 추적 대상이다.
