# Product Spec

## 목적

Open Issue Map은 사용자의 GitHub 프로필과 온보딩 설문을 바탕으로 시작하기 좋은 오픈소스 이슈를 추천하고, 관심 이슈와 PR 활동을 한 화면에서 관리하게 돕는다.

## 사용자 흐름

1. 사용자는 `/login`에서 GitHub OAuth로 로그인한다.
2. 첫 진입 시 `/`는 로그인 여부와 온보딩 완료 여부를 확인한다.
3. 온보딩 미완료 사용자는 `/onboarding`에서 설문을 작성한다.
4. 온보딩 완료 사용자는 메인 영역 `/(main)`에 접근한다.
5. 메인 영역에서는 대시보드, 북마크, PR 이력, 프로필을 사용할 수 있다.

## 화면 범위

### `/login`

- GitHub OAuth 로그인 버튼 제공
- NextAuth `signIn('github')` 사용
- 로그인 후 기본 이동 대상은 `/dashboard`

### `/onboarding`

- 로그인 필수
- GitHub 저장소 언어를 기반으로 초기 언어 후보를 채운다.
- 사용자가 다음 항목을 선택한다.
  - 경험 수준: `beginner | junior | mid | senior`
  - 관심 기여 유형: `doc | bug | feat | test | review`
  - 선호 언어
  - 주간 투입 가능 시간: `2 | 5 | 10`
  - 목적: `portfolio | growth | community`
- 저장 성공 시 `/dashboard`로 이동한다.

### `/(main)/dashboard`

- 로그인 및 온보딩 완료 필수
- 사용자의 온보딩 프로필 기반 추천 이슈 목록을 제공한다.
- 필터:
  - 언어
  - 난이도
  - 기여 유형
  - 스타 수 (100+ / 500+ / 1,000+ / 5,000+)
  - 최소 점수
- 무한 스크롤로 다음 페이지와 다음 GitHub batch를 조회한다.
- 활성 필터 적용 시 결과가 희박하면 자동 스크롤을 중단하고 수동 "이슈 더 찾아보기" 안내를 표시한다.
- GitHub 일부 query 실패 시 partial result 상태를 표시할 수 있다.
- 이슈 북마크 추가/삭제가 가능하다. 삭제는 Popover 확인창을 통해 처리한다.

### `/(main)/bookmarks`

- 저장한 이슈 목록을 보여준다.
- GitHub 조회가 실패해도 DB에 저장된 북마크 정보로 fallback 카드가 표시될 수 있다.
- 북마크 삭제가 가능하다.

### `/(main)/pr-history`

- 사용자가 제출한 외부 저장소 PR 이력을 보여준다.
- 본인 소유 저장소의 PR은 제외한다.
- 상태 필터:
  - `OPEN`
  - `MERGED`
  - `CLOSED`
- 요약 통계:
  - 전체 PR 수
  - merged/open/closed 수
  - additions/deletions 합계

### `/(main)/profile`

- GitHub 계정 정보
- 온보딩 설정 요약
- 북마크/PR 활동 요약

## 인증과 접근 제어

- 페이지 보호는 서버 컴포넌트와 layout에서 처리한다.
- `/(main)/layout.tsx`는 로그인과 온보딩 완료 여부를 확인한다.
- API는 각 Route Handler에서 `auth()` 또는 `requireGithubToken()`을 호출한다.
- API는 redirect가 아니라 JSON `401`을 반환한다.
- 클라이언트 fetch는 `401 UNAUTHORIZED` 또는 `401 NO_ACCESS_TOKEN`이면 `/login`으로 이동한다.

이 항목들은 실제 사용자 지표가 생긴 뒤 [SCALING_PLAN.md](./SCALING_PLAN.md)에 따라 판단한다.
