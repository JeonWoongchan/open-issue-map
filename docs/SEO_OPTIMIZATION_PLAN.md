# SEO 최적화 작업 문서

이 문서는 `Open Issue Map`의 SEO 최적화 작업을 세션이 바뀌어도 이어서 진행할 수 있도록 남기는 기준 문서입니다.

목표는 단순히 메타 태그를 추가하는 것이 아니라, 검색엔진이 이해할 수 있는 공개 페이지 구조를 만들고, 인증 기반 앱에서 색인해야 할 페이지와 색인하지 말아야 할 페이지를 명확히 분리하는 것입니다. 이 경험은 블로그 포스팅과 이직용 이력서에 "실무적인 SEO 개선 경험"으로 정리할 수 있어야 합니다.

---

## 1. 작업 목적

### 제품 관점

- GitHub 오픈소스 이슈 탐색 서비스인 `Open Issue Map`의 검색 노출 기반을 만든다.
- 검색엔진과 소셜 공유 미리보기가 서비스의 목적을 명확히 이해하도록 한다.
- 로그인 이후 앱 화면은 불필요하게 색인하지 않고, 공개 진입 페이지와 설명성 페이지를 중심으로 색인 전략을 세운다.

### 개발 경험 관점

- Next.js App Router 기반 SEO 적용 경험을 만든다.
- metadata, canonical, sitemap, robots, Open Graph, structured data, Core Web Vitals, Search Console 검증까지 한 흐름으로 경험한다.
- "SEO를 안다"가 아니라 "실제 프로젝트에 적용하고 검증했다"로 이력서에 쓸 수 있는 산출물을 만든다.

### 포스팅 관점

블로그 글은 아래 흐름으로 작성한다.

1. 일반적인 SEO 최적화 방안
2. 이 프로젝트에서 SEO 최적화를 적용한 내용
3. 아쉬운 점과 발전 방향

---

## 2. 공식 기준과 참고 문서

SEO 관련 판단은 블로그 글보다 공식 문서를 우선한다.

- Google Search technical requirements
  - https://developers.google.com/search/docs/essentials/technical
  - 핵심 기준: Googlebot이 차단되지 않아야 하고, 페이지가 HTTP 200으로 동작해야 하며, 색인 가능한 콘텐츠가 있어야 한다.
- Google SEO Starter Guide
  - https://developers.google.com/search/docs/fundamentals/seo-starter-guide
  - URL 구조, 중복 콘텐츠, canonical, 사이트 구조 판단에 사용한다.
- Google structured data guide
  - https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
  - 구조화 데이터는 Google이 페이지 의미를 이해하도록 돕는 보조 신호다. JSON-LD를 우선 검토한다.
- Google JavaScript SEO basics
  - https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
  - 클라이언트 렌더링 의존도를 줄이고, 중요한 콘텐츠가 HTML에 존재하는지 확인할 때 참고한다.
- Google Core Web Vitals / Page Experience
  - https://support.google.com/webmasters/answer/9205520
  - https://developers.google.com/search/docs/appearance/page-experience
  - LCP, INP, CLS와 실제 사용자 경험 측정 기준을 정리할 때 참고한다.
- Next.js Metadata and OG images
  - https://nextjs.org/docs/app/getting-started/metadata-and-og-images
  - Next.js App Router의 metadata, OG 이미지, sitemap, robots 적용 기준이다.
- Next.js sitemap file convention
  - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js robots file convention
  - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- Next.js Open Graph image convention
  - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

---

## 3. 현재 프로젝트 SEO 현황

확인일: 2026-05-15

### 기술 스택

- Next.js 15.5.15
- App Router
- React 19.1.0
- TypeScript strict 기반
- Vercel Analytics 사용
- GitHub OAuth 기반 인증 서비스

### 확인된 현재 상태

- `src/app/layout.tsx`에 공통 metadata 기본값, `metadataBase`, Open Graph, Twitter card, icons가 있다.
- `html lang="ko"`가 설정되어 있다.
- `src/app/page.tsx`는 공개 랜딩 페이지로 동작하며 `/` canonical과 JSON-LD를 선언한다.
- `/dashboard`는 게스트에게도 추천 이슈 미리보기를 보여주며 색인 대상 metadata를 가진다.
- `(main)` 그룹의 `/bookmarks`, `/profile`, `/pr-history` 등은 로그인 필요 페이지이며 route group layout에서 `noindex` 처리한다.
- `/login`, `/onboarding`은 `noindex` 처리한다.
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`를 추가했다.
- `src/lib/seo.ts`, `src/lib/metadata.ts`에 SEO 상수, metadata helper, JSON-LD 생성 helper를 분리했다.
- public asset에는 `brand-signature.svg`, `brand-signature.png`가 있다.

### 구조적 판단

이 프로젝트는 일반 블로그나 쇼핑몰처럼 모든 URL을 색인시키는 서비스가 아니다. 인증 후 사용하는 앱 화면이 많으므로 SEO 전략은 다음처럼 나누는 것이 맞다.

- 색인 대상: 공개 랜딩/서비스 소개, 공개 추천 이슈 미리보기, 추후 공개 문서/가이드/블로그 페이지
- 제한 또는 noindex 대상: 로그인, 온보딩, 북마크, 마이페이지, PR 히스토리, API 라우트, 사용자 개인화 페이지
- 소셜 공유 대상: 서비스 소개 페이지, 공개 대시보드 미리보기, 추후 블로그 포스트

---

## 4. SEO 작업 범위

### A. 크롤링과 색인 제어

- `src/app/robots.ts` 추가
- `src/app/sitemap.ts` 추가
- 공개 페이지와 비공개 페이지의 index/noindex 정책 정의
- API 라우트와 인증 전용 페이지는 sitemap에서 제외
- canonical URL 기준 도메인 정의

결정한 내용:

- 운영 도메인은 README 기준 `https://openissuemap.com`을 기본값으로 사용한다.
- 배포 환경별 canonical 기준 도메인을 바꿀 수 있도록 `NEXT_PUBLIC_SITE_URL`을 도입했다.
- `/`는 공개 랜딩 페이지로 두고, `/dashboard`는 공개 추천 이슈 미리보기 페이지로 색인 대상에 포함한다.

### B. Metadata 체계화

- root metadata에 `metadataBase` 추가
- 기본 title template 정의
- 기본 description 개선
- route별 metadata 추가
- canonical alternates 설정
- robots metadata로 로그인 전용 페이지 noindex 처리

현재 적용한 페이지 정책:

- `/`: 공개 랜딩, index, canonical `/`
- `/dashboard`: 공개 추천 이슈 미리보기, index, canonical `/dashboard`
- `/login`: noindex
- `/onboarding`: noindex
- `/bookmarks`: noindex
- `/profile`: noindex
- `/pr-history`: noindex

### C. Open Graph와 Twitter 카드

- 서비스 공유용 OG 이미지 추가
- `openGraph` metadata 작성
- `twitter` metadata 작성
- `opengraph-image.tsx` 또는 정적 `opengraph-image.png` 사용 검토

실무 포인트:

- OG 이미지는 검색 SEO 자체보다 공유 CTR과 신뢰도에 중요하다.
- `brand-signature.png`를 그대로 쓸지, 서비스 가치 제안이 들어간 1200x630 이미지를 새로 만들지 결정한다.

### D. 구조화 데이터

우선 적용 후보:

- `WebSite`
- `SoftwareApplication` 또는 `WebApplication`
- `Organization` 또는 `Person`은 운영 주체가 명확해진 뒤 검토
- 블로그 페이지를 만들면 `BlogPosting` 또는 `Article`
- 서비스 안내 문서가 생기면 `BreadcrumbList`

주의:

- 구조화 데이터는 실제 화면 내용과 일치해야 한다.
- Google rich result 대상이 아닌 schema를 억지로 넣지 않는다.
- JSON-LD는 서버 컴포넌트에서 안전하게 렌더링하는 패턴을 만든다.

### E. 콘텐츠와 정보 구조

- 검색 의도가 있는 공개 페이지를 만든다.
- 첫 화면에 서비스가 무엇인지, 누구를 위한 것인지, 어떤 문제를 해결하는지 텍스트로 드러나야 한다.
- "오픈소스 첫 기여", "GitHub good first issue 찾기", "초보자 오픈소스 기여" 같은 검색 의도와 연결되는 콘텐츠를 검토한다.
- 내부 링크 구조를 만든다.

후보 공개 콘텐츠:

- 오픈소스 첫 기여 가이드
- good first issue 찾는 방법
- GitHub 이슈 라벨 해석 가이드
- 이슈 기여 전 확인 체크리스트
- Open Issue Map 사용법

### F. 성능과 Core Web Vitals

- LCP 후보 요소 확인
- 불필요한 클라이언트 컴포넌트와 JS 번들 확인
- 이미지 크기와 포맷 점검
- 폰트 로딩 전략 점검
- CLS를 유발하는 동적 영역 확인
- INP에 영향을 주는 상호작용 많은 컴포넌트 확인

검증 후보:

- `pnpm build`
- Lighthouse
- PageSpeed Insights
- Vercel Analytics
- Search Console Core Web Vitals 보고서

### G. 접근성과 의미론적 HTML

SEO와 접근성은 완전히 같지는 않지만, 검색엔진이 문서를 이해하는 데 의미론적 구조가 도움이 된다.

- 페이지별 `h1` 하나 유지
- heading 계층 점검
- 링크 텍스트를 의미 있게 작성
- 버튼과 링크 역할 분리
- 이미지 alt 점검
- 주요 콘텐츠가 client-only 데이터에만 의존하지 않는지 확인

### H. 검증과 운영

- 배포 URL에서 `robots.txt`, `sitemap.xml` 접근 확인
- HTML source에 title, meta description, canonical, OG 태그가 있는지 확인
- Search Console 등록
- sitemap 제출
- URL Inspection으로 렌더링된 HTML 확인
- Rich Results Test로 JSON-LD 확인
- 배포 후 색인 여부와 노출 검색어 추적

---

## 5. 진행도

상태 값:

- `TODO`: 아직 시작 전
- `IN_PROGRESS`: 진행 중
- `DONE`: 완료
- `BLOCKED`: 결정 또는 외부 조건 필요

| 상태 | 작업 | 파일/영역 | 메모 |
|---|---|---|---|
| DONE | SEO 작업 문서 생성 | `docs/SEO_OPTIMIZATION_PLAN.md` | 세션 인계용 문서 |
| DONE | 운영 도메인 결정 | `.env.example`, `src/lib/seo.ts` | README 기준 `https://openissuemap.com`, env override 가능 |
| IN_PROGRESS | 현재 SEO baseline 측정 | 배포 URL / Lighthouse / HTML source | 로컬 build 기준 1차 검증 완료, 배포 URL 검증 필요 |
| DONE | root metadata 정리 | `src/app/layout.tsx` | metadataBase, title template, OG/Twitter 기본값 |
| DONE | route별 metadata 설계 | `src/app/**/page.tsx`, `layout.tsx` | 공개/비공개 정책 분리 |
| DONE | 비공개 페이지 noindex 처리 | `(auth)`, `(main)`, `onboarding` | 로그인/개인화 페이지 색인 방지 |
| DONE | robots 생성 | `src/app/robots.ts` | API, 개인화 페이지 제외 |
| DONE | sitemap 생성 | `src/app/sitemap.ts` | 공개 URL만 포함 |
| DONE | canonical 설정 | metadata alternates | `/`, `/dashboard` 기준 |
| DONE | OG/Twitter 카드 추가 | `src/app/opengraph-image.tsx`, `twitter-image.tsx` | 공유 미리보기 이미지 생성 |
| DONE | JSON-LD 패턴 추가 | `src/components/seo/JsonLd.tsx` | WebSite/WebApplication 적용 |
| DONE | 공개 랜딩 전략 결정 | `/`, `src/middleware.ts` | 비로그인 루트는 공개 랜딩, 로그인 사용자는 앱으로 이동 |
| DONE | metadata helper 분리 | `src/lib/metadata.ts` | canonical/noindex/JSON-LD 생성 규칙 분리 |
| DONE | 랜딩 UI 분리 | `src/components/landing/HomeLanding.tsx` | route entry와 공개 콘텐츠 UI 책임 분리 |
| TODO | 콘텐츠 SEO 후보 작성 | docs 또는 app route | 오픈소스 첫 기여 가이드 연계 |
| TODO | Core Web Vitals 점검 | Lighthouse / bundle analyzer | 성능 개선 근거 확보 |
| TODO | Search Console 등록 | 운영 도메인 | 배포 후 진행 |
| TODO | 블로그 초안 작성 | 외부 블로그 또는 repo docs | 적용 전후 중심 |
| TODO | 이력서 bullet 작성 | resume draft | 수치/검증 결과 반영 |

---

## 6. 1차 구현 기록

작업일: 2026-05-15

이번 작업의 핵심은 "검색엔진이 볼 수 있는 공개 진입점"과 "검색엔진에 노출하지 않을 개인화 화면"을 분리하는 것이다.

### 6.1 공개 루트 페이지 전환

변경 파일:

- `src/app/page.tsx`
- `src/components/landing/HomeLanding.tsx`
- `src/middleware.ts`
- `src/middleware.test.ts`

이전 구조:

- `/` 요청이 middleware에서 로그인 상태에 따라 `/login`, `/onboarding`, `/dashboard`로 redirect됐다.
- 비로그인 검색엔진은 서비스 소개 페이지가 아니라 로그인 페이지로 이동하게 된다.

변경 구조:

- 비로그인 사용자는 `/`에서 공개 서비스 소개 페이지를 볼 수 있다.
- 온보딩 미완료 로그인 사용자는 `/onboarding`으로 이동한다.
- 온보딩 완료 로그인 사용자는 `/dashboard`로 이동한다.

SEO 관점의 이유:

- 검색엔진은 로그인 이후 개인화 화면보다 공개 HTML 콘텐츠를 먼저 이해해야 한다.
- 루트 페이지에 서비스 목적, 대상 사용자, 핵심 기능, 내부 링크를 텍스트로 제공하면 색인 가능한 콘텐츠가 생긴다.
- `page.tsx`는 route metadata와 페이지 조립만 담당하고, 실제 랜딩 UI는 `HomeLanding` 컴포넌트로 분리했다.

### 6.2 공통 SEO 상수 추가

변경 파일:

- `src/lib/seo.ts`
- `.env.example`

추가한 기준:

- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `SITE_KEYWORDS`
- `SITE_URL`
- `absoluteUrl()`

운영 도메인은 README에 적힌 `https://openissuemap.com`을 기본값으로 사용한다. 배포 환경에서 도메인을 바꿀 수 있도록 `NEXT_PUBLIC_SITE_URL` 환경 변수도 추가했다.

### 6.3 Metadata 기본값 개선

변경 파일:

- `src/app/layout.tsx`
- `src/lib/metadata.ts`

적용한 항목:

- `metadataBase`
- title default/template
- description
- keywords
- Open Graph
- Twitter card
- icon

SEO 관점의 이유:

- `metadataBase`가 있어야 상대 경로 OG 이미지와 canonical URL을 안정적으로 절대 URL로 해석할 수 있다.
- title template을 두면 route별 title을 추가해도 서비스명과 일관되게 연결된다.
- canonical은 전역 layout에 두지 않고 페이지별로 둔다. 전역 canonical은 새 공개 페이지가 생겼을 때 모든 페이지가 `/`를 대표 URL로 가리키는 문제가 생길 수 있기 때문이다.
- 반복되는 page metadata와 noindex metadata는 `createPageMetadata()`, `createNoIndexMetadata()` helper로 분리했다. page/layout에서는 페이지 고유 문구와 canonical 경로만 넘긴다.

### 6.4 공개/비공개 페이지 색인 정책 분리

변경 파일:

- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(main)/layout.tsx`
- `src/app/onboarding/page.tsx`

정책:

- `/`: index
- `/dashboard`: index
- `/login`: noindex
- `/onboarding`: noindex
- `/bookmarks`: noindex
- `/profile`: noindex
- `/pr-history`: noindex

SEO 관점의 이유:

- `/dashboard`는 비로그인 미리보기로 공개 가치가 있다.
- 로그인, 온보딩, 북마크, 마이페이지, PR 히스토리는 개인화 화면이므로 검색 결과에 노출될 이유가 없다.

### 6.5 robots와 sitemap 추가

변경 파일:

- `src/app/robots.ts`
- `src/app/sitemap.ts`

sitemap 포함 URL:

- `/`
- `/dashboard`

robots disallow:

- `/api/`
- `/onboarding`
- `/bookmarks`
- `/profile`
- `/pr-history`

SEO 관점의 이유:

- sitemap에는 검색엔진이 발견하길 원하는 공개 URL만 넣는다.
- API와 개인화 화면은 크롤링 예산을 쓰지 않도록 제외한다.

### 6.6 OG/Twitter 이미지 추가

변경 파일:

- `src/app/opengraph-image.tsx`
- `src/app/twitter-image.tsx`

적용 내용:

- Next.js `ImageResponse`로 1200x630 공유 이미지를 생성한다.
- 서비스명, 핵심 가치 제안, 기능 키워드를 이미지에 포함했다.
- 빌드가 외부 폰트 다운로드에 의존하지 않도록 OG 이미지 내부 문구는 ASCII 중심으로 작성했다.

블로그 기록 포인트:

- 검색 SEO 자체보다 소셜 공유 CTR과 신뢰도 개선에 가까운 작업이다.
- Next.js file convention을 사용해 별도 이미지 생성 파이프라인 없이 구현했다.

### 6.7 JSON-LD 추가

변경 파일:

- `src/components/seo/JsonLd.tsx`
- `src/lib/metadata.ts`
- `src/app/page.tsx`

적용 schema:

- `WebSite`
- `WebApplication`

SEO 관점의 이유:

- 구조화 데이터는 검색엔진이 페이지 의미를 더 명확히 이해하도록 돕는다.
- 실제 화면에 존재하는 서비스 설명과 맞는 최소 schema만 넣었다.

주의:

- JSON-LD는 rich result를 보장하지 않는다.
- 실제 페이지 내용과 다른 schema를 넣으면 안 된다.

---

## 7. 1차 검증 결과

검증일: 2026-05-15

### 실행한 명령어

```bash
pnpm test -- src/middleware.test.ts
pnpm build
```

### 결과

- `src/middleware.test.ts`: 7개 테스트 통과
- `pnpm build`: 성공
- Next.js 빌드에서 다음 metadata route가 생성됨
  - `/robots.txt`
  - `/sitemap.xml`
  - `/opengraph-image`
  - `/twitter-image`
- `/`는 static page로 생성됨
- `/dashboard`는 dynamic page로 유지됨

추가 확인:

- `src/app/page.tsx`를 route entry로 줄이고 `HomeLanding`을 분리한 뒤에도 `pnpm build`가 성공했다.
- `src/lib/metadata.ts`에서 `Metadata` 타입을 helper 반환 타입으로 유지해 Next.js metadata export 타입 경고를 해결했다.

### 빌드 중 발견하고 수정한 점

처음 `opengraph-image.tsx`에 한글 문구를 넣었을 때 Next.js `ImageResponse`가 한글 폰트를 동적으로 가져오려고 했다. 로컬 샌드박스 환경에서는 외부 네트워크가 막혀 폰트 fetch 경고가 발생했다.

해결:

- OG 이미지 내부 문구를 영어/ASCII 중심으로 변경했다.
- metadata description과 페이지 본문은 한국어를 유지했다.

블로그 기록 포인트:

```text
OG 이미지는 단순 이미지가 아니라 빌드 파이프라인의 일부다.
동적 이미지 생성에서 폰트 의존성이 생기면 CI/샌드박스/네트워크 제한 환경에서 문제가 될 수 있어,
폰트를 직접 포함하거나 ASCII 중심 디자인으로 안정성을 확보해야 한다.
```

### 아직 필요한 검증

- 배포 URL 기준 `/robots.txt` 확인
- 배포 URL 기준 `/sitemap.xml` 확인
- 실제 HTML source에서 title, description, canonical, OG 태그 확인
- Rich Results Test로 JSON-LD 확인
- PageSpeed Insights 또는 Lighthouse 점수 기록
- Google Search Console 등록과 sitemap 제출

---

## 8. 바로 다음 작업 순서

다음 세션에서는 아래 순서로 시작한다.

1. 현재 baseline을 배포 URL 기준으로 기록한다.
   - 배포 URL의 HTML source에서 title, description, canonical, OG 태그 확인
   - `/robots.txt`, `/sitemap.xml` 존재 여부 확인
   - Lighthouse 또는 PageSpeed Insights 결과 캡처

2. 2차 구현을 한다.
   - 공개 콘텐츠/가이드 페이지 추가
   - 성능 개선과 이미지/폰트 최적화

3. Search Console과 구조화 데이터를 검증한다.
   - Search Console 등록
   - sitemap 제출
   - URL Inspection 확인
   - Rich Results Test로 JSON-LD 확인

4. 검증 결과를 이 문서에 업데이트한다.
   - 실행한 명령어
   - 배포 URL
   - Lighthouse 점수
   - Search Console 상태
   - 남은 문제

---

## 9. 구현 시 원칙

- 검색엔진을 속이는 작업은 하지 않는다.
- 실제 페이지 내용과 metadata/structured data를 일치시킨다.
- 인증이 필요한 개인화 페이지는 색인 대상에서 제외한다.
- SEO 관련 코드는 서버 컴포넌트와 App Router metadata API를 우선 사용한다.
- 외부 라이브러리보다 Next.js 기본 metadata file convention을 우선 사용한다.
- SEO 개선은 "태그 추가"가 아니라 "검색엔진이 이해할 수 있는 공개 정보 구조 설계"로 접근한다.

---

## 10. 블로그 포스팅 설계

제목 후보:

- Next.js App Router 프로젝트에 실무형 SEO 적용하기
- 개인 프로젝트에 SEO를 실무처럼 적용해본 기록
- Open Issue Map SEO 개선기: metadata부터 sitemap, structured data까지

### 1부. 일반적인 SEO 최적화 방안

다룰 내용:

- SEO는 검색엔진이 페이지를 발견, 크롤링, 색인, 이해, 노출하는 전체 과정이다.
- 최소 기술 요건: 크롤러 접근 가능, HTTP 200, 색인 가능한 콘텐츠
- Technical SEO: robots, sitemap, canonical, status code, redirect, JS rendering
- On-page SEO: title, description, heading, 본문 구조, 내부 링크
- Search appearance: Open Graph, Twitter card, structured data
- Performance SEO: Core Web Vitals, LCP/INP/CLS
- 운영 SEO: Search Console, sitemap 제출, URL Inspection, 지속 모니터링

포스팅 관점의 핵심 메시지:

```text
SEO 최적화는 meta 태그 몇 개를 추가하는 일이 아니라,
검색엔진이 접근해도 되는 페이지와 접근하면 안 되는 페이지를 구분하고,
공개 페이지의 의미와 품질을 꾸준히 검증하는 작업이다.
```

### 2부. 이 프로젝트에서 SEO 최적화 적용한 내용

다룰 내용:

- 프로젝트 특성: GitHub OAuth 기반 개인화 서비스
- 문제: 모든 페이지를 색인시키면 안 되는 구조
- 해결 전략: 공개 페이지와 인증 페이지 분리
- 적용 항목:
  - root metadata 개선
  - route별 metadata
  - noindex 정책
  - robots.ts
  - sitemap.ts
  - canonical
  - Open Graph/Twitter card
  - JSON-LD
  - 공개 콘텐츠 전략
  - Lighthouse/PageSpeed 검증
  - Search Console 제출
- 코드 예시:
  - `src/app/layout.tsx`
  - `src/app/robots.ts`
  - `src/app/sitemap.ts`
  - JSON-LD 컴포넌트

기록할 지표:

- 적용 전/후 HTML head 비교
- sitemap/robots 응답 캡처
- Lighthouse 전/후 점수
- LCP/INP/CLS 개선 여부
- Search Console 색인 상태
- 공유 미리보기 확인 결과

### 3부. 아쉬운 점과 발전 방향

다룰 내용:

- 개인화 서비스라 색인 가능한 페이지가 제한적이다.
- 검색 유입을 키우려면 공개 콘텐츠 전략이 필요하다.
- 실제 검색 성과는 배포 후 시간이 걸린다.
- Search Console 데이터가 쌓이기 전까지는 기술 검증 중심이다.
- 향후 방향:
  - 오픈소스 기여 가이드 공개 페이지
  - 이슈 라벨/난이도 설명 페이지
  - 공개 추천 이슈 컬렉션
  - 다국어 SEO
  - dynamic OG image
  - 성능 예산과 모니터링 자동화

---

## 11. 이력서에 적을 수 있는 형태

SEO 적용 후 실제 검증 결과를 넣어 아래처럼 정리한다.

```text
Open Issue Map | 개인 프로젝트, 배포/운영 중
- Next.js App Router Metadata API 기반으로 route별 title, description, canonical, Open Graph, robots 정책을 설계하고 적용
- 인증 기반 서비스 특성을 고려해 공개 페이지와 개인화 페이지의 색인 정책을 분리하고 sitemap/robots.txt를 구성
- Google Search Central 기준에 맞춰 구조화 데이터, HTML head, sitemap, robots, Core Web Vitals를 점검하고 Search Console로 검증
- Lighthouse/PageSpeed Insights와 Vercel Analytics를 활용해 SEO 적용 전후의 기술 지표를 기록
```

수치가 생기면 아래처럼 바꾼다.

```text
- Lighthouse SEO 점수를 X점에서 Y점으로 개선하고, sitemap/robots/canonical/OG/JSON-LD를 배포 환경에서 검증
```

---

## 12. 세션 인계 메모

다음 작업자는 먼저 이 파일의 `5. 진행도`와 `8. 바로 다음 작업 순서`를 확인한다.

1차 SEO 코드는 반영했고 로컬 테스트와 빌드는 통과했다. 다음 작업자는 배포 URL 기준으로 Search Console, Lighthouse, HTML source, sitemap/robots 응답을 확인하고 수치를 추가한다.

운영 canonical 도메인은 README 기준 `https://openissuemap.com`으로 잡았다. 다른 도메인으로 배포한다면 `NEXT_PUBLIC_SITE_URL` 값을 먼저 바꾼다.
