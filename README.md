# Open Issue Map

> 오픈소스에 기여하고 싶지만 **어디서 어떻게 시작할지 모르는** 개발자를 위한 이슈 추천 서비스입니다.

**서비스 바로가기:** [https://openissuemap.com](https://openissuemap.com)

---

## 한눈에 보기

GitHub 계정으로 로그인한 뒤 간단한 온보딩 정보를 입력하면, 경험 수준·언어·기여 목적에 맞는 오픈소스 이슈를 추천 점수 순으로 보여줍니다. 관심 이슈는 북마크로 저장하고, AI 분석으로 기여 진입점을 빠르게 파악할 수 있습니다.

## 핵심 기능

| 기능 | 설명 |
| --- | --- |
| **맞춤 이슈 추천** | 언어·난이도·기여유형·경쟁도·시간·목적·저장소 인지도 7개 차원으로 추천 점수 산정 |
| **AI 작업 가이드** | 이슈·사용자 프로필·저장소 README를 종합해 Gemini가 개인화된 기여 가이드를 제공 |
| **북마크** | 관심 이슈 저장. GitHub API 장애 시에도 DB 저장 정보로 목록 유지 |
| **PR 히스토리** | 외부 저장소에 제출한 PR 기록과 통계 확인 |
| **사용자 온보딩** | 경험·언어·기여방식·기여목적을 수집해 추천 기준으로 활용 |

---

## 기술 스택

| 영역 | 기술 | 선택 이유 |
| --- | --- | --- |
| Framework | Next.js 15 App Router (React 19) | 서버 컴포넌트·Route Handler·인증 보호 레이아웃을 단일 앱에서 처리하기 위해 |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI | 접근성 있는 Radix primitive와 디자인 토큰 기반 스타일링으로 빠르게 일관된 UI 구성 |
| Language | TypeScript strict | API 응답·추천 점수 모델처럼 데이터 형태가 중요한 영역에서 런타임 오류 예방 |
| Auth | NextAuth v5, GitHub OAuth | OAuth 인증 흐름과 세션/token을 통합 관리 |
| Database | Neon PostgreSQL | 사용자·프로필·북마크처럼 관계가 명확한 데이터를 서버리스 PostgreSQL로 관리 |
| Server State | TanStack Query v5 | pagination·cache·mutation을 컴포넌트에서 분리해 관리 |
| AI | Google Gemini API | 이슈 분석에 필요한 자연어 이해와 구조화된 JSON 응답을 저비용으로 처리 |
| Validation | Zod v4 | Route Handler 입력값과 외부 API 응답을 도메인 진입 전에 명시적으로 검증 |
| Test | Vitest | 추천 점수·필터·Route Handler·인증 테스트, ESM 모듈 테스트에 적합 |

---

## 핵심 기술 결정

포트폴리오로서 가장 의미 있는 설계 판단들을 정리합니다.

### 1. 추천 알고리즘 — 왜 7개 독립 차원인가

GitHub 이슈 추천은 단순 키워드 매칭으로 해결되지 않습니다. 언어가 맞아도 난이도가 높으면 초심자에게 무의미하고, 난이도가 맞아도 이미 PR이 달렸다면 기여 기회가 없습니다. 이 두 문제를 동시에 해결하기 위해 **7개 차원을 독립적으로 채점하고 합산**하는 방식을 선택했습니다.

독립 차원 구조를 선택한 이유는 **확장성** 때문입니다. 각 차원이 분리되어 있으므로 가중치 조정이나 새 차원 추가가 다른 로직에 영향을 주지 않습니다. 반대로 단일 스코어링 함수로 구현했다면, 조건 추가 때마다 기존 케이스가 깨질 위험이 큽니다.

### 2. GitHub API 캐싱 — 30분 TTL과 freshness vs cache 트레이드오프

GitHub API의 인증 요청 rate limit은 **시간당 5,000건**입니다. 추천 이슈 1회 조회에 GraphQL 배치 요청이 발생하므로, 사용자가 새로고침할 때마다 API를 호출하면 limit이 빠르게 소진됩니다.

이슈 데이터는 **실시간성보다 신선도**가 더 중요하다고 판단했습니다. GitHub 이슈 상태(열림/닫힘, 댓글 수)는 수 분 안에 극적으로 바뀌는 경우가 드물기 때문입니다. 이 판단에 근거해 서버 캐시 TTL을 **30분**으로 설정했습니다.

동시에 **사용자별·언어 선택별로 캐시 키를 분리**해, A 사용자의 요청이 B 사용자의 캐시를 오염시키지 않도록 설계했습니다. 사용자가 직접 새로고침을 요청하면 캐시를 무효화할 수 있는 수동 갱신 경로도 열어두었습니다.

### 3. AI Selective Inference — 비용 폭주 방지 설계

대시보드의 모든 이슈를 자동으로 분석하는 **eager inference** 방식은 비용과 응답 속도 모두 비효율적입니다. 대신 **사용자가 명시적으로 AI 분석 버튼을 누른 이슈만** Gemini를 호출하는 selective inference를 채택했습니다.

비용 폭주를 세 겹으로 방어했습니다.

- **비로그인 한도:** 비로그인 사용자는 하루 5회까지만 허용하고, IP 기반 카운트를 DB에 저장합니다. 서버 `GITHUB_TOKEN`이 없으면 요청 자체가 차단됩니다.
- **클라이언트 캐싱:** `staleTime: Infinity`로 같은 이슈를 세션 내에서 재분석하지 않습니다. AI 호출은 "처음 버튼을 누를 때" 딱 한 번만 발생합니다.
- **재시도 없음:** `retry: 0`으로 실패 시 자동 재시도를 막아 장애 상황에서의 비용 증폭을 방지합니다.

rule-based 추천 점수 시스템과 AI 분석은 **완전히 독립**되어 있습니다. 하나가 장애가 나도 다른 쪽에 영향이 없습니다.

---

## 아키텍처

```text
Browser
  TanStack Query — staleTime 캐싱, 무한스크롤
  ↕ fetch / JSON

Next.js App Router (Vercel)
  middleware     — auth · onboarding 리다이렉트
  Route Handlers — requireGithubToken() / auth()
                   Zod 입력 검증 → Domain Service 호출
  ↕

Domain Services
  scorer / ranking  — 7차원 추천 점수 계산
  unstable_cache    — GitHub 응답 30분 캐싱
  guest-usage       — 비로그인 AI 한도 체크 (IP · DB)
  ↕

GitHub API          Gemini API          Neon PostgreSQL
```

### 계층을 나눈 이유

- **Route Handler:** 클라이언트가 GitHub token이나 DB에 직접 접근하지 않도록 내부 BFF 역할을 합니다.
- **Domain Service:** 추천 점수, PR 이력 가공, 북마크 fallback처럼 테스트가 필요한 로직을 UI와 분리했습니다.
- **Client Hooks:** TanStack Query key, infinite query, mutation, optimistic update를 화면 컴포넌트에서 분리했습니다.

---

## AI 분석 파이프라인

AI 분석 버튼을 누르면 아래 파이프라인이 실행됩니다.

### 입력 데이터

```text
클라이언트 전송 (이슈 카드)
  title, body, labels, language, repoFullName

서버에서 추가
  userExperienceLevel, userPurpose, userWeeklyHours  ← DB (온보딩 프로필)
  contributingGuide                                   ← GitHub README (24시간 저장소별 캐시)
```

토큰(로그인 사용자: OAuth 토큰 / 비로그인: 서버 `GITHUB_TOKEN`)으로 README를 가져옵니다. 캐시는 사용자별·저장소별로 분리되며 24시간 유지됩니다.

### 전처리

```text
이슈 본문 → cleanIssueBody()
  코드블록 → [코드 블록 생략]
  HTML 태그·이미지·링크 URL 제거
  2,000자 제한

저장소 README → cleanReadme()
  이미지·배지([![...](url)](url)) 제거
  링크 URL 제거, 텍스트만 유지
  코드블록 유지 (설치·실행 명령은 기여에 유용)
  5,000자 제한
```

### 프롬프트 구성

```text
[System Prompt]
역할: 오픈소스 기여 실무 가이드
응답 형식: JSON만 허용
difficulty 기준: 이슈 절대 난이도 X — 기여자 수준 대비 상대적 난이도

[User Prompt]  buildAnalysisPrompt()로 생성
┌─────────────────────────────────────────────┐
│ [기여자 정보]                                │
│ 경험 수준: 초급 (간단한 버그·문서 경험 있음) │
│ 기여 목적: 포트폴리오 구축                   │
│ 주당 투입 가능 시간: 5시간                   │
│                                             │
│ [이슈 정보]                                  │
│ 저장소: facebook/react                       │
│ 주요 언어: TypeScript       (null이면 생략)  │
│ 라벨: bug, good first issue (없으면 생략)    │
│ 제목: Fix login button                      │
│ 이슈 내용: ...cleanIssueBody 처리된 본문...  │
│                        (null이면 생략)       │
│                                             │
│ [프로젝트 개요 (README)]   (없으면 생략)      │
│ ...cleanReadme 처리된 README 내용...         │
└─────────────────────────────────────────────┘
```

### 응답 및 검증

Gemini는 `responseMimeType: application/json`으로 JSON만 반환합니다. 응답은 즉시 Zod 스키마로 런타임 검증합니다.

```text
issueAnalysisSchema 검증
  concepts:      string[]  min 2, max 4
  scope:         string    min 1
  startingPoints: string[] min 2, max 3
  cautions:      string[]  min 1, max 3
  difficulty:    '쉬움' | '보통' | '어려움'
```

검증 실패 시 Gemini 응답이 규격 밖임을 의미하며 500으로 처리됩니다.

---

## 추천 알고리즘 상세

이슈 후보를 수집한 뒤 온보딩 프로필과 이슈 메타데이터를 **7가지 기준**으로 비교해 추천 점수를 산정합니다.

### 추천 흐름

1. 온보딩 프로필을 로드합니다.
2. 선호 언어를 기준으로 GitHub 이슈 후보를 언어별 병렬 조회합니다.
3. URL 기준 중복 이슈를 제거합니다.
4. 이슈 라벨·제목·본문·댓글 수·연결 PR 여부·저장소 정보를 기반으로 점수를 계산합니다.
5. 추천 점수 50점 미만 이슈를 제거합니다.
6. 사용자 필터를 적용하고 반환합니다.

### 점수 산정 기준 (최대 100점)

| 차원 | 최대 점수 | 기준 |
| --- | --- | --- |
| 언어 일치 | +28 | 선택 언어 일치 / 계열 언어 / 불일치 |
| 난이도 적합도 | +23 | 이슈 라벨로 난이도 추정 후 경험 수준과 비교. 라벨 없으면 경험 수준별 부분 점수 |
| 기여 방식 일치 | +16 | 라벨·제목·본문 키워드로 bug/feat/doc/test/review 감지 |
| 경쟁도 | +8 | PR 연결 여부·댓글 수로 선점 위험 추정. 경험 수준별 보정 |
| 기여 목적 | +14 | portfolio / growth / community 목적에 맞는 이슈 유형·저장소 우대 |
| 투입 가능 시간 | +7 | 주당 시간(2h/5h/10h)에 맞는 난이도·방식 일치 시 가산 |
| 저장소 인지도 | +4 | star 수 구간별 가산 (100 / 300 / 1000 / 3000+) |

상세 규칙은 [docs/SCORING_RULES.md](./docs/SCORING_RULES.md)에 정리했습니다.

---

## 문제 해결 경험

### 1. GitHub API 응답 지연 대응

**문제 상황**

무한스크롤로 이슈 목록을 불러올 때 매 페이지마다 평균 2.5초의 지연이 발생했습니다. Route Handler 구간별 계측 결과, 지연의 95%가 GitHub Search API 응답 대기였습니다. 나머지 구간(세션 복호화, DB 조회, 채점·필터링)의 합산은 300ms 미만으로, 코드 레벨에서 개선할 수 있는 여지가 없었습니다.

**해결 방안**

GitHub API 지연 자체는 줄일 수 없으므로 호출 횟수를 최소화하는 2단계 캐싱 전략을 적용했습니다.

- **서버 캐싱 (`Next.js unstable_cache`):** 배치 커서 단위로 이슈 30개를 한 번에 수집한 뒤 30분간 캐싱합니다. 배치 내 페이지 이동(offset=10, 20...)은 GitHub API를 재호출하지 않습니다.
- **클라이언트 캐싱 (`TanStack Query staleTime`):** 로드된 목록을 30분간 신선한 데이터로 간주합니다. 다른 페이지 이동 후 재진입해도 즉시 렌더링됩니다.

| 요청 유형 | 응답 시간 |
| --- | --- |
| 배치 첫 요청: GitHub API 호출 (배치당 1회) | 2.2 ~ 2.7s |
| 배치 내 페이지 이동: 서버 캐시 히트 | ~670ms |
| 페이지 재진입: 클라이언트 캐시 히트 | ~660ms |

### 2. GitHub API 장애 대비

**문제 상황**

GitHub API는 rate limit, 일시적 오류, 특정 언어 쿼리 실패처럼 부분적으로 실패하는 경우가 있습니다. 단순히 오류를 그대로 올려버리면 작은 장애도 사용자 화면 전체를 비우게 됩니다.

- **추천 이슈 목록:** TypeScript·Python을 선택했을 때 Python 쿼리만 rate limit에 걸리면 TypeScript 이슈까지 사라짐
- **북마크 목록:** GitHub API로 최신 이슈 정보를 보강하는데, API 장애 시 저장해둔 북마크가 화면에서 완전히 사라짐

**해결 방안**

- **`Promise.allSettled`로 언어별 쿼리 부분 실패 격리:** 일부가 실패해도 성공한 결과는 반환합니다. `partialResults: true` 플래그를 함께 내려 클라이언트가 "일부 결과입니다" 안내를 표시하도록 했습니다.
- **북마크 최소 정보를 DB에 함께 저장:** 북마크 저장 시점에 이슈 제목과 URL을 DB에 함께 저장해 GitHub API와 무관하게 최소 정보를 유지합니다.

---

## 인증과 보안 설계

GitHub access token은 클라이언트에 노출하지 않습니다.

- GitHub OAuth 로그인은 NextAuth가 처리합니다.
- 서버는 HttpOnly JWT 쿠키를 기반으로 session을 생성합니다.
- GitHub API가 필요한 Route Handler는 `requireGithubToken(req)`를 통해 서버에서 token을 꺼냅니다.
- 클라이언트는 내부 API만 호출하고, GitHub API와 DB에는 직접 접근하지 않습니다.

---

## 데이터 모델

| 테이블 | 역할 |
| --- | --- |
| `users` | GitHub OAuth 사용자 기본 정보. GitHub id를 식별 기준으로 사용 |
| `user_profiles` | 온보딩 설문과 추천 기준 |
| `bookmarks` | 저장한 이슈 정보. GitHub API 장애 시 title/url로 fallback UI 구성 |
| `ai_guest_usage` | 비로그인 AI 분석 일일 사용 횟수. IP별 관리, 24시간 TTL로 자동 초기화 |

---

## 화면

### 랜딩

![랜딩화면](docs/screenshots/landing.png)

### 온보딩

![온보딩화면](docs/screenshots/onboarding.png)

경험 수준, 기여 유형, 선호 언어, 주간 가능 시간, 기여 목적을 5단계로 입력합니다. GitHub 저장소 언어 정보를 자동으로 가져와 초기 언어 후보를 구성합니다.

### 추천 이슈

![대시보드화면](docs/screenshots/dashboard.png)

추천 점수와 함께 저장소·제목·라벨·댓글 수·스타 수를 표시합니다. 무한스크롤과 GitHub 배치 커서 기반 페이지네이션으로 이슈를 탐색합니다.

### AI 작업 가이드

![AI분석화면](docs/screenshots/ai-analysis.png)

이슈 카드의 AI 분석 버튼을 누르면 이슈 내용·사용자 온보딩 프로필·저장소 README를 종합해 Gemini가 분석합니다. 필요한 개념, 예상 작업 범위, 기능 역할 중심의 진입점, 주의사항을 난이도와 함께 제공합니다. 비로그인 사용자는 하루 5회 무료로 사용할 수 있습니다.

### 북마크

![북마크화면](docs/screenshots/bookmarks.png)

북마크 토글은 낙관적 업데이트로 즉시 반응합니다. 저장 시점의 title/url을 DB에 보관해 GitHub API 장애 시에도 목록 확인이 가능합니다.

### PR 히스토리

![PR히스토리화면](docs/screenshots/pr-history.png)

본인 소유 저장소 PR을 제외한 오픈소스 기여 PR 이력을 보여줍니다.

### 마이페이지

![마이페이지화면](docs/screenshots/profile.png)

GitHub 계정 정보, 온보딩 설정, 북마크/PR 활동 요약을 확인합니다.

---

## 문서

- [추천 점수 규칙](./docs/SCORING_RULES.md)
- [DB 스키마](./docs/DB_SCHEMA.md)
- [API 명세](./docs/API.md)
