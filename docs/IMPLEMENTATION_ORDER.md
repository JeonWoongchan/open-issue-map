# Implementation Order

현재 코드는 포트폴리오/소규모 실제 배포 기준으로 동작 가능한 상태다. 이 문서는 앞으로 작업할 때 우선순위를 정하기 위한 기준이다.

## 완료된 핵심 작업

- GitHub OAuth 로그인
- NextAuth JWT에 GitHub access token 저장
- 사용자 upsert
- 온보딩 설문 저장
- 추천 이슈 조회와 점수화
- 북마크 저장/삭제/목록
- 이슈 북마크 낙관적 업데이트 및 연속 클릭 버그 수정
- 북마크 삭제 확인 UI Popover 전환 (scroll lock 제거)
- PR 이력 조회
- 마이페이지 기본 정보/활동 정보
- GitHub 오류 구조화
- 주요 API Route Handler 테스트
- 메모리 기반 middleware rate limit 제거
- 이슈 필터에 스타 수(100+/500+/1,000+/5,000+) 추가
- 엄격한 필터 적용 시 수동 조회(IssueCandidateLoadMoreNotice) 구현
- repo health 캐시 조회 이중 DB 쿼리 제거
- scrollbar-gutter 기반 레이아웃 흔들림 방지
- API 계약 문서화
- 확장 계획 문서화

## 배포 전 필수 확인

1. 환경 변수 설정
   - `DATABASE_URL`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `AUTH_SECRET`
2. GitHub OAuth App production callback URL
   - `https://배포도메인/api/auth/callback/github`
3. DB migration
   - `pnpm db:migrate`
4. 검증 명령
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`
5. smoke test
   - 로그인
   - 온보딩 저장
   - 대시보드 추천 이슈 조회
   - 북마크 저장/삭제
   - PR 이력 조회
   - 마이페이지 조회

## 다음 우선순위

### 1. 운영 안정성

현재 우선순위가 가장 높다.

- production 환경 변수 검증
- 배포 후 GitHub OAuth callback 확인
- Neon connection string 확인
- Route Handler error log 확인
- GitHub rate limit 발생 여부 확인

### 2. 문서와 테스트 유지

코드 변경 시 함께 갱신한다.

- API 변경: `docs/API.md`, `src/types/api.ts`, route test
- DB 변경: migration, `docs/DB_SCHEMA.md`
- 추천 규칙 변경: `docs/SCORING_RULES.md`, scorer/service tests
- 확장 전략 변경: `docs/SCALING_PLAN.md`

### 3. UX 개선

실제 사용자 피드백이 생기면 진행한다.

- GitHub API 실패 시 더 구체적인 메시지
- 온보딩 언어 자동 추출 실패 안내
- 추천 이슈 empty state 개선
- 북마크 fallback 카드 품질 개선

### 4. 확장 대응

실제 지표가 생긴 뒤 진행한다.

- 외부 저장소 기반 rate limit
- GitHub API 요청 dedupe
- stale cache fallback
- 구조화 로그/APM
- DB 인덱스/쿼리 튜닝

자세한 기준은 [SCALING_PLAN.md](./SCALING_PLAN.md)를 따른다.

## 지금 하지 않아도 되는 작업

- Redis/Upstash rate limit
- 관리자 페이지
- multi-region 구성
- DB read replica
- 복잡한 role/permission 시스템
- OAuth provider 추가

현재 목표가 포트폴리오/토이 프로젝트인 만큼, 실제 병목이 관측되기 전까지는 복잡한 인프라를 추가하지 않는다.

## 변경 관리 원칙

- 작은 단위로 변경한다.
- Route Handler 변경은 테스트를 추가한다.
- 서버/클라이언트 API 계약이 바뀌면 문서를 갱신한다.
- access token과 secret이 클라이언트나 로그에 노출되지 않게 확인한다.
- 사용자 데이터가 들어가는 캐시 key에는 `userId`를 포함한다.
