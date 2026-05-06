# Scaling Plan

이 문서는 Open Issue Map이 포트폴리오/토이 프로젝트 단계를 넘어 실제 사용자 트래픽을 받을 때 어떤 지표를 보고 어떤 순서로 확장할지 정리한다.

지금 당장 모두 구현할 항목이 아니라, 서비스가 커질 때 판단 기준으로 사용할 운영 계획이다.

## 현재 전제

- 사용자 규모를 예측할 수 없다.
- 대규모 트래픽 발생 근거가 아직 없다.
- GitHub API와 Neon PostgreSQL에 의존한다.
- Next.js Route Handler가 내부 BFF 역할을 한다.
- 메모리 기반 rate limit middleware는 제거했다.

따라서 지금은 복잡한 인프라보다 다음을 우선한다.

- API 응답 계약 유지
- 실패 응답 구조화
- 테스트로 회귀 방지
- 배포 후 관찰 가능한 로그 확보
- 병목이 보일 때 증거 기반으로 확장

## 확장 판단 지표

| 지표 | 기준 예시 | 의미 |
| --- | --- | --- |
| API p95 latency | 주요 API p95가 1~2초 이상 지속 | 사용자 체감 지연 |
| API error rate | 5xx가 1% 이상 지속 | 서버 또는 외부 의존성 불안정 |
| GitHub rate limit | `RATE_LIMITED` 반복 발생 | GitHub 호출량 또는 캐시 부족 |
| DB timeout | query timeout 또는 connection limit | DB 병목 |
| 비용 증가 | hosting/DB 비용 급증 | 트래픽 또는 비효율 호출 증가 |
| 특정 route 과호출 | 일부 API 호출량 비정상 증가 | abuse 또는 UI 중복 호출 |
| 로그인 사용자 증가 | DAU/WAU 증가 | 사용자 기준 보호와 캐시 필요 |

## 1단계: 관측성 확보

대규모 대응의 첫 단계는 방어 로직이 아니라 관측성이다.

우선 볼 항목:

- API route별 요청 수
- API route별 latency
- HTTP status 분포
- error code별 발생 수
- GitHub API 실패 원인
- DB query 실패와 timeout
- 로그인 성공/실패 수

초기에는 Vercel Functions 로그, Neon 대시보드, GitHub API 응답 코드를 확인한다. 트래픽이 생기면 Sentry, Axiom, Datadog, OpenTelemetry 같은 도구를 검토한다.

로그에는 access token, OAuth secret, DB URL, raw request body를 남기지 않는다.

## 2단계: GitHub API 보호

이 서비스에서 가장 먼저 병목이 될 가능성이 높은 외부 의존성은 GitHub API다.

현재 보호 장치:

- GitHub 오류 class 변환
- `getGitHubErrorResponse()` 기반 구조화 응답
- 일부 `unstable_cache`
- repo health DB cache

확장 시 추가할 항목:

1. 요청 dedupe
   - 같은 사용자, 같은 query, 같은 batch 요청은 하나의 GitHub 호출로 합친다.

2. 캐시 정책 조정
   - 추천 이슈, PR 목록, repo health TTL을 실제 지표 기준으로 조정한다.

3. stale fallback
   - GitHub 실패 시 이전 캐시 데이터가 있으면 stale data를 반환하고 partial 상태를 표시한다.

4. GitHub 403 세분화
   - rate limit이 아닌 권한 부족, abuse detection, secondary rate limit을 구분한다.

주의:

- access token을 캐시 key나 로그에 넣지 않는다.
- 사용자별 데이터 캐시에는 반드시 `userId`를 포함한다.

## 3단계: 요청 폭주 방어

실제 과호출이나 비용 증가가 보이면 외부 저장소 기반 rate limit을 추가한다.

권장 설계:

- 저장소: Upstash Redis, Vercel KV, Redis Cloud 등 atomic increment 지원 저장소
- 로그인 사용자: `userId + routeGroup`
- 비로그인 사용자: `ip + routeGroup`
- 응답: `429 RATE_LIMITED`, 가능하면 `Retry-After` header
- 관측: route, 기준 key 종류, hit 수 기록

route group 예시:

| Group | 대상 | 정책 |
| --- | --- | --- |
| `auth` | `/api/auth/**` | 너무 엄격하게 제한하지 않음 |
| `github-read` | `/api/github/issues`, `/api/github/pull-requests`, `/api/mypage/activity` | 엄격 |
| `bookmark-write` | `POST/DELETE /api/bookmarks` | 중간 |
| `onboarding-write` | `POST /api/onboarding` | 낮은 빈도 |
| `health` | `/api/health` | 제외 또는 별도 정책 |

사용자 기준 rate limit은 인증 이후에 가능하므로 middleware보다 Route Handler helper가 더 적합할 수 있다.

## 4단계: DB 확장성

확인할 지표:

- connection limit
- slow query
- query timeout
- lock wait
- storage/CPU 증가

우선 점검할 query:

- `users.github_id` 조회
- `user_profiles.user_id` 조회
- `bookmarks` user별 목록과 count
- `repo_health_cache.repo_full_name` 조회

확장 작업:

- Neon pooling connection string 사용 여부 확인
- 조회 패턴에 맞는 index 확인
- count 비용이 커지면 summary cache 검토
- migration은 preview/staging에서 먼저 검증

## 5단계: 클라이언트 호출 최적화

서버 병목처럼 보이는 문제가 클라이언트 중복 호출일 수 있다.

점검할 항목:

- 같은 API 중복 호출
- 필터 변경 시 과도한 refetch
- infinite query page 중복 요청
- mutation 후 invalidate 범위 과다

개선 방향:

- TanStack Query key 명확화
- stale time 조정
- 관련 query만 invalidate
- 버튼 중복 클릭 방지

## 6단계: 보안과 abuse 대응

사용자가 늘면 성능뿐 아니라 남용 대응도 중요해진다.

우선순위:

- OAuth callback URL production 값 확인
- `AUTH_SECRET` rotation 절차 마련
- access token 로그/응답 노출 점검
- API 입력 검증 유지
- GitHub repo name 검증 강화
- 의심 요청 패턴 기록

필요해지면 bot 방어, blocklist, 관리자용 abuse 대응을 추가한다.

## 단계별 실행 계획

### 지금 하지 않아도 되는 것

- Redis 기반 rate limit
- 전문 APM 도입
- 부하 테스트 자동화
- 복잡한 cache invalidation
- multi-region 구성
- DB read replica

### 배포 직후 확인

- production env 설정
- OAuth callback URL
- `pnpm db:migrate`
- 로그인, 온보딩, 대시보드, 북마크, PR 이력, 마이페이지 smoke test
- Vercel/Neon/GitHub 기본 로그

### 사용자가 생기면 먼저 할 것

1. API별 요청 수와 latency 확인
2. GitHub rate limit 확인
3. DB connection/slow query 확인
4. 에러 코드별 발생 비율 확인
5. 가장 많이 호출되는 API부터 캐시/제한 적용

## 현재 상태 평가

현재 서비스는 포트폴리오/소규모 실제 배포 기준으로 충분하다.

- production build 통과
- 테스트 통과
- API 응답 계약 문서화
- 주요 Route Handler 예외 구조화
- GitHub 인증/rate limit 오류 매핑
- DB schema와 도메인 로직 분리

대규모 트래픽 대응은 아직 완성 상태가 아니며, 실제 지표가 보일 때 Redis rate limit, 관측성, 캐시 강화, DB 튜닝을 추가한다.
