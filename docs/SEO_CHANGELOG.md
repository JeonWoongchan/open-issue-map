# SEO 변경사항 파일별 기록

이 문서는 `Open Issue Map`에 적용한 SEO 관련 변경사항을 파일 단위로 설명한다.

목적은 세 가지다.

- 나중에 LLM 세션이 바뀌어도 어떤 파일을 왜 바꿨는지 바로 이해한다.
- 블로그 포스팅에서 "이 프로젝트에 실제로 적용한 내용" 섹션의 원천 자료로 사용한다.
- 이력서나 면접에서 SEO 작업을 설명할 때 과장 없이 구체적으로 말할 수 있게 한다.

관련 계획 문서:

- `docs/SEO_OPTIMIZATION_PLAN.md`

---

## 읽는 방법

각 파일은 아래 형식으로 기록한다.

```text
파일:
변경 요약:
왜 바꿨는가:
SEO 관점:
주의점:
포스팅에 옮길 포인트:
```

상태 값:

- `DONE`: 적용 완료
- `TODO`: 아직 적용 전
- `REVISIT`: 적용했지만 다시 검토 필요

---

## 1. `src/app/(main)/layout.tsx`

상태: `DONE`

### 변경 요약

`(main)` 라우트 그룹 레이아웃에 `metadata.robots` 설정을 추가했다.

```ts
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}
```

### 왜 바꿨는가

`(main)` 아래 페이지는 로그인한 사용자의 개인화 영역이다.

현재 포함되는 페이지:

- `/bookmarks`
- `/profile`
- `/pr-history`

이 페이지들은 사용자의 북마크, GitHub 계정 정보, PR 기록처럼 개인화된 데이터를 보여준다. 검색 결과에 노출될 필요가 없고, 검색엔진이 접근해도 로그인 리다이렉트나 제한된 화면을 보게 될 가능성이 높다.

그래서 개별 페이지마다 `noindex`를 반복하는 대신, 라우트 그룹 레이아웃에서 한 번에 색인 제외 정책을 선언했다.

### SEO 관점

SEO는 모든 페이지를 검색엔진에 노출하는 작업이 아니다. 검색엔진이 볼 가치가 있는 공개 페이지와, 색인하면 안 되는 개인화 페이지를 분리하는 것도 SEO 최적화다.

`index: false`는 검색 결과에 이 페이지를 넣지 말라는 의미다.

`follow: false`는 이 페이지 내부 링크를 크롤링 경로로 적극 따라가지 말라는 의미다.

`googleBot`에도 같은 값을 둬서 Googlebot에도 명시적으로 동일한 정책을 적용했다.

### 구조적 판단

이 설정을 페이지별로 흩뿌리지 않고 `(main)` 레이아웃에 둔 이유는 라우트 그룹의 책임이 명확하기 때문이다.

```text
(main) = 로그인 이후 개인화 앱 영역 = noindex
```

이렇게 레이아웃 단위에 정책을 두면 이후 `/settings`, `/account` 같은 개인화 페이지가 추가되어도 기본적으로 같은 색인 정책을 상속받는다.

### 주의점

나중에 `(main)` 아래에 공개 색인 대상 페이지를 넣으면 안 된다. 공개 콘텐츠는 별도 라우트 그룹을 만들거나 해당 페이지에서 metadata 정책을 다시 검토해야 한다.

예를 들어 공개 가이드 페이지를 만든다면 `(main)` 아래가 아니라 별도 공개 라우트에 두는 것이 맞다.

### 포스팅에 옮길 포인트

```text
인증 기반 서비스에서는 모든 페이지를 sitemap에 넣는 것이 아니라,
검색엔진이 볼 수 있는 공개 페이지와 로그인 이후 개인화 페이지를 분리해야 했다.
Open Issue Map에서는 북마크, 마이페이지, PR 히스토리를 route group layout에서 noindex 처리했다.
```

---

## 2. `src/app/layout.tsx`

상태: `DONE`

### 변경 요약

루트 레이아웃의 `metadata`를 기본 SEO 설정의 기준점으로 정리했다.

추가한 핵심 항목:

- `metadataBase`
- `applicationName`
- title default/template
- description
- keywords
- authors/creator
- Open Graph 기본값
- Twitter card 기본값
- icons

```ts
export const metadata: Metadata = {
  metadataBase: SITE_URL,
  applicationName: SITE_TITLE,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_TITLE} 서비스 미리보기`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image"],
  },
}
```

### 왜 바꿨는가

`src/app/layout.tsx`는 App Router에서 전체 앱의 공통 HTML과 metadata 기본값을 담당한다.

SEO 관점에서는 모든 페이지가 최소한 아래 정보를 갖고 있어야 한다.

- 서비스 이름
- 기본 설명
- 소셜 공유 기본 이미지
- 상대 URL을 절대 URL로 바꿀 기준 도메인
- 페이지별 title을 일관되게 만드는 title template

이 값들이 페이지마다 흩어져 있으면 설명 문구, 사이트명, OG 이미지가 서로 달라질 수 있다. 그래서 서비스 공통 값은 `src/lib/seo.ts`에 모으고, root layout에서 가져다 쓰도록 했다.

### SEO 관점

`metadataBase`는 중요하다.

Next.js metadata에서 `/opengraph-image`, `/twitter-image` 같은 상대 경로를 사용하면, 검색엔진과 소셜 플랫폼이 최종적으로 접근할 절대 URL이 필요하다. `metadataBase`가 이 기준 URL 역할을 한다.

`title.template`은 페이지별 title을 일관되게 만든다.

예:

```text
추천 이슈 | Open Issue Map
로그인 | Open Issue Map
```

Open Graph와 Twitter card는 Google 검색 순위 자체보다는 공유 미리보기 품질에 가깝다. 하지만 링크가 공유될 때 서비스가 무엇인지 명확히 보이게 하므로 실무 SEO 작업에서 함께 챙기는 항목이다.

### 구조적 판단

이 파일은 "공통 기본값"만 담당한다.

canonical URL은 전역 layout에 두지 않는다. canonical은 페이지마다 달라져야 하기 때문이다.

예를 들어 전역 layout에 `canonical: "/"`를 넣으면, 나중에 `/guide/open-source-first-contribution` 같은 공개 페이지가 생겼을 때 그 페이지도 `/`를 대표 URL로 가리킬 위험이 있다. 그러면 검색엔진은 가이드 페이지가 독립적인 문서인지 판단하기 어려워진다.

따라서 canonical은 각 공개 페이지의 `metadata.alternates.canonical`에서 따로 지정한다.

현재 적용:

- `/`: `src/app/page.tsx`에서 canonical `/`
- `/dashboard`: `src/app/(dashboard)/dashboard/page.tsx`에서 canonical `/dashboard`

### 주의점

`keywords`는 예전처럼 검색 순위를 직접 올려주는 핵심 요소로 보면 안 된다. 여기서는 서비스의 주제를 일관되게 문서화하는 보조 정보로 둔다.

새 공개 페이지를 만들면 root layout의 기본값에 기대지 말고, 그 페이지에 맞는 title, description, canonical을 별도로 작성해야 한다.

로그인이나 개인화 페이지는 root layout의 기본 metadata를 상속하더라도, 해당 route layout/page에서 `noindex`를 명시해야 한다.

### 포스팅에 옮길 포인트

```text
Next.js App Router에서는 root layout의 metadata를 SEO 기본값의 기준점으로 사용할 수 있다.
다만 canonical처럼 페이지마다 달라져야 하는 값은 전역 layout에 두면 안 된다.
공통 title template, description, OG/Twitter 기본값은 root layout에 두고,
canonical과 noindex 정책은 route 성격에 맞춰 페이지 또는 route group에서 분리했다.
```

---

## 3. `src/lib/metadata.ts`

상태: `DONE`

### 변경 요약

페이지별 metadata를 만들 때 반복되는 구조를 helper 함수로 분리했다.

추가한 함수:

- `createPageMetadata()`
- `createNoIndexMetadata()`
- `createHomeJsonLd()`

```ts
export function createPageMetadata({
  title,
  description,
  canonicalPath,
}: CreatePageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
  }
}
```

```ts
export function createNoIndexMetadata({
  title,
  description,
}: {
  title?: string
  description?: string
} = {}): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  }
}
```

### 왜 바꿨는가

Next.js App Router에서는 최종 metadata를 `page.tsx` 또는 `layout.tsx`에서 export해야 한다. 하지만 모든 페이지에 `alternates.canonical`이나 `robots.noindex` 구조를 직접 반복하면 실수하기 쉽다.

예를 들어 noindex 페이지마다 아래 구조를 반복하면 누락이나 불일치가 생길 수 있다.

```ts
robots: {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
}
```

그래서 반복되는 metadata 구조는 helper로 묶고, 각 페이지는 자신에게 필요한 문구와 경로만 넘기도록 바꿨다.

### SEO 관점

SEO metadata는 페이지마다 달라져야 하지만, 생성 규칙은 일관되어야 한다.

`createPageMetadata()`는 공개 색인 대상 페이지에 canonical을 반드시 넣게 만드는 역할을 한다.

`createNoIndexMetadata()`는 로그인, 온보딩, 개인화 페이지가 같은 noindex 정책을 공유하게 만든다.

`createHomeJsonLd()`는 루트 랜딩 페이지에 들어갈 `WebSite`, `WebApplication` 구조화 데이터를 만든다.

### 구조적 판단

역할을 아래처럼 나눴다.

```text
src/lib/seo.ts
= 서비스명, 설명, canonical 기준 도메인 같은 상수

src/lib/metadata.ts
= 페이지별 metadata 객체와 JSON-LD 데이터를 만드는 helper

page.tsx / layout.tsx
= 해당 라우트의 title, description, canonicalPath, noindex 정책 선언
```

이 구조는 metadata를 한 파일에 전부 몰아넣는 방식보다 페이지 맥락을 유지하기 쉽다. 페이지 고유 문구는 page 근처에 남고, 반복되는 생성 규칙만 helper로 빠진다.

### 주의점

metadata helper가 있다고 해서 모든 페이지에 같은 metadata를 넣으면 안 된다. 공개 페이지는 검색 의도에 맞는 고유 title과 description을 가져야 한다.

동적 라우트가 생기면 `generateMetadata()`를 써야 할 수 있다. 이때도 helper를 재사용하되, 콘텐츠 데이터에 맞춰 title/description/canonical을 생성해야 한다.

### 포스팅에 옮길 포인트

```text
Next.js에서는 page/layout에서 metadata를 export해야 하지만,
반복되는 canonical/noindex 구조는 helper로 분리할 수 있다.
Open Issue Map에서는 createPageMetadata와 createNoIndexMetadata를 만들어
공개 페이지와 개인화 페이지의 SEO 정책을 일관되게 관리했다.
```

---

## 4. `src/app/page.tsx`

상태: `DONE`

### 변경 요약

루트 페이지를 공개 랜딩 페이지의 조립 지점으로 정리했다.

현재 `page.tsx`에 남긴 역할:

- `/` canonical metadata export
- JSON-LD 삽입
- 공개 랜딩 컴포넌트 렌더링

```tsx
export const metadata: Metadata = createPageMetadata({ canonicalPath: '/' })

export default function HomePage() {
    return (
        <>
            <JsonLd data={createHomeJsonLd()} />
            <HomeLanding />
        </>
    )
}
```

### 왜 바꿨는가

처음 SEO 랜딩을 만들면서 `page.tsx` 안에 아래 내용이 한꺼번에 들어갔다.

- metadata
- feature card 데이터
- JSON-LD 데이터
- header/footer 포함 랜딩 UI
- CTA 버튼
- 공개 설명 섹션

이 상태는 동작은 하지만, route 파일이 너무 많은 책임을 갖게 된다. 그래서 `page.tsx`는 Next.js route entry 역할만 남기고 실제 랜딩 UI는 `HomeLanding` 컴포넌트로 분리했다.

### SEO 관점

SEO 페이지는 metadata만으로 완성되지 않는다. 검색엔진이 읽을 수 있는 실제 HTML 본문이 필요하다.

`HomeLanding`에는 아래 공개 콘텐츠가 들어간다.

- 서비스 H1
- 서비스 설명 문장
- 추천 이슈 미리보기 CTA
- GitHub 로그인 CTA
- 핵심 기능 카드
- 오픈소스 첫 기여 탐색 흐름 설명

반면 JSON-LD는 화면 UI가 아니라 검색엔진에 전달하는 구조화 데이터이므로 `createHomeJsonLd()`로 분리했다.

### 구조적 판단

역할을 아래처럼 나눴다.

```text
src/app/page.tsx
= route metadata와 페이지 조립

src/components/landing/HomeLanding.tsx
= 공개 랜딩 UI와 검색엔진이 읽을 본문 콘텐츠

src/lib/metadata.ts
= JSON-LD와 metadata 생성 helper
```

이렇게 나누면 나중에 랜딩 문구나 기능 카드를 수정할 때 route metadata와 구조화 데이터를 건드리지 않아도 된다.

### 주의점

`HomeLanding`은 공개 랜딩이므로 로그인 사용자 전용 데이터나 클라이언트 전용 API 호출을 넣지 않는다. 검색엔진과 비로그인 사용자가 읽을 수 있는 정적 설명 중심으로 유지한다.

나중에 검색 유입을 위한 가이드 페이지를 만들면 `page.tsx` 안에 모든 내용을 직접 작성하지 말고, 같은 방식으로 route entry와 콘텐츠 컴포넌트를 분리한다.

### 포스팅에 옮길 포인트

```text
루트 페이지는 검색엔진이 처음 만나는 공개 진입점이므로 redirect-only 페이지에서 서비스 설명이 있는 랜딩 페이지로 바꿨다.
다만 page.tsx에 UI와 JSON-LD를 모두 넣으면 책임이 커져서,
page.tsx는 metadata와 조립만 담당하고 실제 랜딩 콘텐츠는 HomeLanding 컴포넌트로 분리했다.
```

---

## 5. `src/components/landing/HomeLanding.tsx`

상태: `DONE`

### 변경 요약

루트 공개 랜딩 UI를 별도 컴포넌트로 분리했다.

포함 내용:

- 게스트용 `MainHeader`
- H1과 서비스 설명
- CTA 버튼
- 기능 카드
- 오픈소스 첫 기여 탐색 흐름 설명
- `AppFooter`

### 왜 바꿨는가

`page.tsx`에 랜딩 UI가 모두 들어가면 라우트 파일이 길어지고, SEO metadata 변경과 UI 문구 변경이 한 파일에서 섞인다.

랜딩 UI를 컴포넌트로 분리하면 다음 장점이 있다.

- route entry가 짧아진다.
- 공개 랜딩 UI의 책임이 명확해진다.
- H1, 설명, CTA, 기능 카드 문구를 한 곳에서 관리할 수 있다.
- 나중에 랜딩 페이지 테스트나 디자인 수정이 쉬워진다.

### SEO 관점

이 컴포넌트는 검색엔진이 읽을 실제 본문 콘텐츠를 담당한다.

특히 아래 텍스트가 중요하다.

```text
나에게 맞는 오픈소스 이슈를 추천받아보세요
```

이 문장은 서비스의 핵심 검색 의도와 연결된다.

- 오픈소스 이슈
- 추천
- 나에게 맞는

기능 카드도 단순 UI 장식이 아니라 페이지 주제를 보강하는 텍스트다.

### 주의점

과한 마케팅 랜딩처럼 만들기보다, 실제 서비스 사용 흐름을 설명하는 정보 구조를 유지한다.

현재 프로젝트는 운영형 도구에 가까우므로 hero만 크게 만들고 내용이 빈 페이지가 되면 안 된다. 검색엔진과 사용자가 이해할 수 있는 기능 설명을 유지해야 한다.

### 포스팅에 옮길 포인트

```text
SEO를 위해서는 head metadata뿐 아니라 실제 본문 콘텐츠가 중요했다.
그래서 루트 페이지에 서비스의 대상 사용자, 핵심 기능, 사용 흐름을 설명하는 공개 랜딩 컴포넌트를 추가했다.
```

---

## 6. `src/app/robots.ts`

상태: `DONE`

### 변경 요약

Next.js metadata file convention으로 `robots.txt`를 생성하는 파일을 추가했다.

적용한 정책:

- `/` 허용
- `/api/` 차단
- `/onboarding` 차단
- `/bookmarks` 차단
- `/profile` 차단
- `/pr-history` 차단
- sitemap 위치를 `absoluteUrl('/sitemap.xml')`로 제공

### 왜 바꿨는가

검색엔진이 접근해도 되는 영역과 굳이 크롤링하지 않아도 되는 영역을 명시하기 위해서다.

API 라우트와 개인화 화면은 검색 결과에 노출할 콘텐츠가 아니다. `robots.ts`에서 차단하면 크롤러가 불필요한 경로를 탐색하는 일을 줄일 수 있다.

### SEO 관점

`robots.txt`는 크롤링 안내 문서다. 색인 제외를 보장하는 보안 장치가 아니라, 검색엔진에게 어떤 경로를 크롤링하지 말아 달라고 알려주는 정책이다.

그래서 개인화 페이지에는 `robots.ts`만 믿지 않고 metadata의 `noindex`도 함께 적용했다.

### 주의점

`robots.txt`는 민감한 URL을 숨기는 수단이 아니다. 누구나 볼 수 있는 공개 파일이므로 비밀 경로나 내부 정보를 적으면 안 된다.

새로운 개인화 라우트가 생기면 `robots.ts`와 noindex 정책을 함께 점검한다.

### 포스팅에 옮길 포인트

```text
robots.txt는 검색엔진에게 크롤링 범위를 안내하는 파일이다.
Open Issue Map에서는 API와 개인화 페이지를 제외하고, 공개 랜딩과 공개 추천 이슈 페이지만 발견되도록 정리했다.
```

---

## 7. `src/app/sitemap.ts`

상태: `DONE`

### 변경 요약

Next.js metadata file convention으로 `sitemap.xml`을 생성하는 파일을 추가했다.

sitemap에 포함한 URL:

- `/`
- `/dashboard`

각 URL에는 `lastModified`, `changeFrequency`, `priority`를 함께 넣었다.

### 왜 바꿨는가

검색엔진이 색인할 가치가 있는 공개 URL을 쉽게 발견할 수 있게 하기 위해서다.

현재 프로젝트는 로그인 이후 개인화 페이지가 많다. 모든 URL을 sitemap에 넣으면 검색엔진에게 잘못된 신호를 줄 수 있으므로 공개 진입점만 넣었다.

### SEO 관점

sitemap은 색인을 강제하는 파일이 아니다. 검색엔진이 크롤링 후보 URL을 발견하고 우선순위를 이해하는 데 도움을 주는 파일이다.

현재 sitemap은 기술 SEO의 최소 기반이다. 검색 유입을 더 키우려면 나중에 오픈소스 기여 가이드 같은 공개 콘텐츠 URL을 추가해야 한다.

### 주의점

새 공개 페이지를 만들면 sitemap에 추가한다.

반대로 로그인이나 사용자 데이터가 필요한 페이지는 sitemap에 넣지 않는다.

### 포스팅에 옮길 포인트

```text
인증 기반 서비스의 sitemap은 모든 라우트를 나열하는 목록이 아니라,
검색엔진이 발견해야 하는 공개 URL만 선별한 목록이어야 했다.
```

---

## 8. `src/app/(auth)/login/page.tsx`

상태: `DONE`

### 변경 요약

로그인 페이지에 `createNoIndexMetadata()`를 적용했다.

설정한 내용:

- title: `로그인`
- description: `GitHub 계정으로 Open Issue Map에 로그인합니다.`
- robots: `noindex`, `nofollow`

### 왜 바꿨는가

로그인 페이지는 검색 사용자가 찾는 핵심 콘텐츠가 아니다. 검색 결과에 로그인 페이지만 노출되면 서비스가 어떤 문제를 해결하는지 전달하기 어렵다.

로그인은 공개 랜딩이나 대시보드에서 이어지는 행동으로 두고, 검색 노출은 공개 설명 페이지가 담당하게 했다.

### SEO 관점

인증 페이지는 보통 noindex 대상이다.

검색엔진이 로그인 페이지를 색인하면 검색 결과 품질이 낮아질 수 있고, 사용자는 서비스 설명 없이 바로 인증 화면을 보게 된다.

### 주의점

noindex는 보안 기능이 아니다. 로그인 접근 제어는 기존 인증 로직으로 유지해야 한다.

### 포스팅에 옮길 포인트

```text
로그인 페이지는 서비스 사용 흐름에는 필요하지만 검색 결과에 노출할 핵심 콘텐츠는 아니므로 noindex 처리했다.
```

---

## 9. `src/app/onboarding/page.tsx`

상태: `DONE`

### 변경 요약

온보딩 페이지에 `createNoIndexMetadata()`를 적용했다.

설정한 내용:

- title: `온보딩`
- description: `Open Issue Map 추천 기준을 설정합니다.`
- robots: `noindex`, `nofollow`

### 왜 바꿨는가

온보딩은 로그인 사용자의 추천 기준을 설정하는 흐름이다. 검색엔진이나 비로그인 사용자에게 독립적으로 노출할 페이지가 아니다.

### SEO 관점

온보딩 페이지가 색인되면 검색 결과에서 사용자가 바로 개인 설정 흐름으로 들어오게 된다. 이는 검색 의도와 맞지 않는다.

검색 결과에는 서비스 설명과 공개 추천 이슈 미리보기처럼 맥락을 제공하는 페이지가 노출되는 편이 낫다.

### 주의점

온보딩 화면의 실제 접근 제어는 SEO metadata가 아니라 인증/라우팅 로직으로 보장해야 한다.

### 포스팅에 옮길 포인트

```text
사용자별 설정 흐름은 검색엔진에게 보여줄 공개 콘텐츠가 아니므로 noindex로 분리했다.
```

---

## 10. `src/app/(dashboard)/dashboard/page.tsx`

상태: `DONE`

### 변경 요약

공개 추천 이슈 페이지에 색인 대상 metadata를 추가했다.

설정한 내용:

- title: `추천 이슈`
- description: `관심사와 현재 수준을 기준으로 오픈소스 첫 기여에 적합한 GitHub 이슈를 살펴봅니다.`
- canonical: `/dashboard`

### 왜 바꿨는가

`/dashboard`는 게스트에게도 추천 이슈 미리보기를 보여준다. 로그인 이후 개인화 화면과 달리, 검색엔진이 읽을 수 있는 공개 가치가 있는 페이지다.

그래서 sitemap에 포함하고, 페이지 고유 title/description/canonical을 선언했다.

### SEO 관점

루트 랜딩이 서비스 소개라면, `/dashboard`는 실제 추천 이슈 경험을 보여주는 공개 미리보기 역할이다.

검색엔진 입장에서는 이 페이지를 통해 서비스가 단순 소개 페이지가 아니라 실제 GitHub 이슈 탐색 기능을 가진 서비스라는 점을 이해할 수 있다.

### 주의점

나중에 `/dashboard`를 완전히 로그인 전용으로 바꾸면 이 페이지는 sitemap에서 제거하고 noindex로 바꿔야 한다.

게스트 미리보기가 계속 유지되는 한, 공개 설명과 실제 표시 콘텐츠가 일치해야 한다.

### 포스팅에 옮길 포인트

```text
Open Issue Map은 인증 기반 서비스지만, `/dashboard`에는 게스트 미리보기가 있어 공개 색인 대상으로 둘 수 있었다.
대신 개인화 영역과 구분하기 위해 canonical과 sitemap 포함 여부를 명시했다.
```

---

## 11. `src/app/opengraph-image.tsx`

상태: `DONE`

### 변경 요약

Next.js `ImageResponse`를 사용해 1200x630 Open Graph 이미지를 생성했다.

이미지에 포함한 내용:

- 서비스명
- 오픈소스 이슈 추천 가치 제안
- GitHub OAuth, issue scoring, bookmarks, PR history 키워드

### 왜 바꿨는가

링크가 Slack, Discord, 카카오톡, X 같은 곳에 공유될 때 텍스트만 보이는 것보다 서비스 목적이 담긴 이미지가 함께 보이는 편이 신뢰도와 클릭률에 유리하다.

### SEO 관점

OG 이미지는 검색 순위를 직접 올리는 핵심 요소라기보다 공유 미리보기 품질을 높이는 요소다.

실무 SEO에서는 검색 결과뿐 아니라 링크가 공유되는 화면까지 포함해 검색/유입 경험을 관리한다.

### 주의점

처음 한글 문구를 넣었을 때 `ImageResponse`가 외부 한글 폰트를 가져오려 했고, 네트워크가 제한된 환경에서 빌드 경고가 발생했다.

현재는 빌드 안정성을 위해 OG 이미지 내부 문구를 영어/ASCII 중심으로 작성했다. 나중에 한글 OG 이미지를 쓰려면 폰트 파일을 프로젝트에 포함하는 방식으로 바꾸는 것이 좋다.

### 포스팅에 옮길 포인트

```text
동적 OG 이미지는 빌드 파이프라인의 일부라서 폰트 의존성도 고려해야 했다.
네트워크 제한 환경에서도 빌드가 안정적으로 통과하도록 이미지 내부 문구는 ASCII 중심으로 정리했다.
```

---

## 12. `src/app/twitter-image.tsx`

상태: `DONE`

### 변경 요약

Twitter 카드 이미지는 Open Graph 이미지 구현을 재사용하도록 re-export했다.

```ts
export { alt, contentType, default, size } from './opengraph-image'
```

### 왜 바꿨는가

현재는 OG 이미지와 Twitter 이미지가 같은 목적을 가진다. 같은 이미지를 두 번 구현하면 문구나 크기, 스타일이 어긋날 수 있으므로 하나의 구현을 재사용했다.

### SEO 관점

Twitter card는 X/Twitter 공유 미리보기를 위한 metadata다. 많은 플랫폼은 OG를 우선 읽지만, Twitter 전용 metadata를 두면 해당 플랫폼에서 더 명확한 카드 형식을 전달할 수 있다.

### 주의점

나중에 X/Twitter 전용 이미지를 다르게 만들 필요가 생기면 이 re-export를 별도 `ImageResponse` 구현으로 바꾸면 된다.

### 포스팅에 옮길 포인트

```text
OG와 Twitter 이미지는 같은 목적의 공유 미리보기 자산이라서 우선 같은 구현을 재사용했다.
```

---

## 13. `src/components/seo/JsonLd.tsx`

상태: `DONE`

### 변경 요약

JSON-LD를 렌더링하는 작은 서버 컴포넌트를 추가했다.

핵심 처리:

- `application/ld+json` script 출력
- 객체 또는 객체 배열 입력 허용
- `JSON.stringify(data).replace(/</g, '\\u003c')`로 `<` 문자 이스케이프

### 왜 바꿨는가

구조화 데이터는 `<script type="application/ld+json">` 형태로 HTML에 들어간다. 이 패턴을 페이지마다 직접 작성하면 escaping 누락이나 중복이 생길 수 있다.

공통 컴포넌트로 만들면 앞으로 블로그 글, 가이드 페이지, breadcrumb schema를 추가할 때 같은 방식으로 안전하게 재사용할 수 있다.

### SEO 관점

JSON-LD는 검색엔진이 페이지의 의미를 이해하도록 돕는 보조 신호다.

이번에는 루트 랜딩에 `WebSite`, `WebApplication` schema만 넣었다. 실제 화면에 없는 내용을 구조화 데이터로 과장하지 않는 것이 중요하다.

### 주의점

`dangerouslySetInnerHTML`을 사용하므로 입력 데이터는 내부에서 생성한 신뢰 가능한 객체만 넘긴다.

사용자 입력이나 외부 API 응답을 그대로 JSON-LD에 넣는 패턴은 피해야 한다.

### 포스팅에 옮길 포인트

```text
JSON-LD는 페이지마다 직접 script를 쓰기보다 공통 컴포넌트로 분리해 escaping과 재사용성을 확보했다.
```

---

## 14. `src/lib/seo.ts`

상태: `DONE`

### 변경 요약

서비스 SEO 기본 상수와 URL helper를 추가했다.

포함 내용:

- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `SITE_KEYWORDS`
- `SITE_URL`
- `absoluteUrl()`

### 왜 바꿨는가

서비스명, 설명, canonical 기준 도메인, 키워드가 여러 파일에 흩어지면 문구 불일치가 생긴다.

그래서 공통 SEO 값은 `src/lib/seo.ts`에 모으고, layout, sitemap, robots, JSON-LD에서 가져다 쓰도록 했다.

### SEO 관점

canonical, sitemap, OG 이미지 URL은 절대 URL 기준이 필요하다.

`SITE_URL`은 `NEXT_PUBLIC_SITE_URL`이 있으면 그 값을 사용하고, 없으면 README 기준 운영 도메인인 `https://openissuemap.com`을 기본값으로 사용한다.

`absoluteUrl()`은 `/sitemap.xml`, `/dashboard` 같은 경로를 운영 도메인 기준 절대 URL로 바꿔준다.

### 주의점

운영 도메인이 바뀌면 `NEXT_PUBLIC_SITE_URL`을 먼저 바꿔야 한다.

잘못된 도메인을 넣으면 sitemap, canonical, OG 이미지 URL이 모두 잘못 생성될 수 있다.

### 포스팅에 옮길 포인트

```text
SEO에서 도메인 기준값은 여러 곳에 쓰이므로 상수로 분리했다.
Open Issue Map에서는 `NEXT_PUBLIC_SITE_URL`을 기준으로 sitemap, canonical, OG URL을 일관되게 만들었다.
```

---

## 15. `src/middleware.ts`

상태: `DONE`

### 변경 요약

비로그인 사용자가 `/`에 접근했을 때 더 이상 `/login`으로 보내지 않고 공개 랜딩 페이지를 볼 수 있게 바꿨다.

현재 루트 접근 정책:

- 비로그인 사용자: `/` 공개 랜딩 유지
- 로그인했지만 온보딩 미완료: `/onboarding`으로 이동
- 로그인했고 온보딩 완료: `/dashboard`로 이동

### 왜 바꿨는가

기존에는 비로그인 루트 접근이 로그인 페이지로 이동했다. 이 구조에서는 검색엔진과 신규 사용자가 서비스 설명을 보기 전에 인증 화면부터 만나게 된다.

SEO 관점에서는 루트 URL이 서비스 목적과 핵심 콘텐츠를 설명하는 공개 페이지여야 한다. 그래서 비로그인 사용자는 루트에 남기고, 로그인 사용자만 앱 흐름으로 보내도록 분리했다.

### SEO 관점

검색엔진은 로그인 이후 개인화 화면보다 공개 HTML 콘텐츠를 먼저 이해해야 한다.

루트에서 공개 랜딩을 제공하면 title, description, H1, 본문, JSON-LD가 모두 같은 서비스 메시지를 전달할 수 있다.

### 주의점

이 middleware의 matcher는 `/`다. 따라서 이번 변경은 루트 진입 정책을 바꾼 것이다.

로그인 사용자 전용 페이지의 실제 접근 제어는 각 페이지와 서버 로직의 기존 인증 흐름을 계속 따라야 한다. SEO noindex 설정이 접근 제어를 대체하지 않는다.

### 포스팅에 옮길 포인트

```text
SEO를 위해 가장 먼저 바꾼 것은 meta 태그가 아니라 루트 URL의 역할이었다.
비로그인 사용자를 로그인 페이지로 보내던 구조를 공개 랜딩으로 바꿔 검색엔진이 읽을 수 있는 진입점을 만들었다.
```

---

## 16. `src/middleware.test.ts`

상태: `DONE`

### 변경 요약

middleware 정책 변경에 맞춰 테스트 기대값을 수정했다.

검증하는 핵심:

- 비로그인 루트 접근은 redirect하지 않는다.
- 온보딩 미완료 로그인 사용자는 `/onboarding`으로 redirect한다.
- 온보딩 완료 로그인 사용자는 `/dashboard`로 redirect한다.

### 왜 바꿨는가

SEO를 위해 루트 정책을 바꿨기 때문에, 기존 테스트가 그대로 남아 있으면 다시 로그인 리다이렉트로 되돌아가는 변경을 막기 어렵다.

테스트를 현재 정책에 맞게 바꿔서 공개 랜딩 진입점이 유지되도록 했다.

### SEO 관점

SEO 설정도 라우팅 정책과 연결되면 테스트 대상이 된다.

특히 공개 URL이 실수로 로그인 리다이렉트가 되면 검색엔진이 색인 가능한 콘텐츠를 읽지 못할 수 있으므로, middleware 테스트가 회귀 방지 역할을 한다.

### 주의점

테스트는 루트 middleware 동작만 검증한다. 배포 후 실제 HTML head, robots, sitemap 응답은 별도 검증이 필요하다.

### 포스팅에 옮길 포인트

```text
SEO 변경도 라우팅 정책을 바꾸는 경우에는 테스트로 보호해야 했다.
루트 URL이 다시 로그인 리다이렉트로 돌아가지 않도록 middleware 테스트를 함께 수정했다.
```

---

## 17. `.env.example`

상태: `DONE`

### 변경 요약

SEO 기준 도메인을 설정하는 환경 변수 예시를 추가했다.

```env
NEXT_PUBLIC_SITE_URL=https://openissuemap.com
```

### 왜 바꿨는가

canonical, sitemap, OG 이미지 URL은 운영 도메인에 의존한다.

로컬, preview, production 환경에서 도메인이 달라질 수 있으므로 코드에만 고정하지 않고 환경 변수로 바꿀 수 있게 했다.

### SEO 관점

검색엔진은 canonical과 sitemap의 URL을 기준으로 대표 문서와 크롤링 대상을 판단한다.

배포 환경에서 도메인이 잘못 설정되면 검색엔진과 소셜 플랫폼이 잘못된 URL을 보게 된다.

### 주의점

실제 배포 환경에는 `.env.example`이 아니라 플랫폼의 환경 변수 설정에 `NEXT_PUBLIC_SITE_URL`을 넣어야 한다.

값은 trailing slash가 있어도 `src/lib/seo.ts`에서 정규화된다.

### 포스팅에 옮길 포인트

```text
SEO URL 생성은 환경에 따라 달라질 수 있으므로 canonical 기준 도메인을 환경 변수로 분리했다.
```

---

## 진행도

| 상태 | 파일 | 메모 |
|---|---|---|
| DONE | `src/app/(main)/layout.tsx` | 개인화 라우트 그룹 noindex 이유 기록 |
| DONE | `src/app/layout.tsx` | 공통 metadata와 전역 canonical 제외 이유 기록 |
| DONE | `src/lib/metadata.ts` | metadata helper와 JSON-LD 생성 helper 분리 이유 기록 |
| DONE | `src/app/page.tsx` | 공개 루트 페이지 조립 역할 기록 |
| DONE | `src/components/landing/HomeLanding.tsx` | 공개 랜딩 UI 분리 이유 기록 |
| DONE | `src/app/robots.ts` | 크롤링 정책 기록 |
| DONE | `src/app/sitemap.ts` | 공개 URL 발견 경로 기록 |
| DONE | `src/app/(auth)/login/page.tsx` | 로그인 페이지 noindex 이유 기록 |
| DONE | `src/app/onboarding/page.tsx` | 온보딩 페이지 noindex 이유 기록 |
| DONE | `src/app/(dashboard)/dashboard/page.tsx` | 공개 추천 이슈 페이지 metadata 기록 |
| DONE | `src/app/opengraph-image.tsx` | 공유 이미지 생성과 폰트 의존성 주의점 기록 |
| DONE | `src/app/twitter-image.tsx` | Twitter 카드 이미지 재사용 이유 기록 |
| DONE | `src/components/seo/JsonLd.tsx` | JSON-LD 안전 렌더링 기록 |
| DONE | `src/lib/seo.ts` | SEO 상수와 canonical URL 기준 기록 |
| DONE | `src/middleware.ts` | 루트 공개 페이지와 인증 라우팅 분리 기록 |
| DONE | `src/middleware.test.ts` | middleware 정책 변경 검증 기록 |
| DONE | `.env.example` | `NEXT_PUBLIC_SITE_URL` 문서화 기록 |
