import type { ExplorePresetIcon as ExplorePresetIconKey } from '@/constants/explore-presets'

type IconProps = {
  className?: string
}

// 프리셋마다 다른 색을 입힐 수 있도록 SVG를 currentColor 기반 인라인 컴포넌트로 둔다.
// sprout처럼 "메인 형태 + 저채도 보조 형태"로 레이어를 줘서 단색 실루엣보다 입체감을 더한다 —
// doc/bug/star도 같은 기법으로 디테일을 맞췄다. 보조 형태는 전부 같은 투명도를 써서
// 아이콘마다 진하기가 제각각으로 보이지 않게 한다(문서의 본문 줄은 장식이 아니라 내용을
// 나타내는 별도 역할이라 이 상수를 안 쓴다).
const DETAIL_OPACITY = 0.6

function SproutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 21V11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M12 11c0-5 3.5-8.5 8.5-8.5C20.5 7.5 17 11 12 11z" fill="currentColor" />
      <path d="M12 14c0-3.5-2.5-6-6-6-.3 2.8 1.9 6 6 6z" fill="currentColor" opacity={DETAIL_OPACITY} />
    </svg>
  )
}

function DocIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-6-6z" fill="currentColor" />
      {/* 접힌 모서리 — 종이가 접힌 듯한 음영을 준다 */}
      <path d="M14 2v5a1 1 0 0 0 1 1h5z" fill="currentColor" opacity={DETAIL_OPACITY} />
      {/* 본문 텍스트 줄 — 장식용 보조 형태가 아니라 "내용이 있다"를 나타내는 역할이라 DETAIL_OPACITY와 무관하게 진하게 둔다 */}
      <path
        d="M7.8 12.3h6.4M7.8 15.3h6.4M7.8 18.3h4"
        stroke="var(--background)"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}

function BugIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <ellipse cx="12" cy="13.5" rx="6" ry="6.5" fill="currentColor" />
      {/* 등껍질 무늬 — 몸통보다 옅은 점 2개로 질감을 준다 */}
      <circle cx="10" cy="12" r="1.15" fill="var(--background)" opacity={DETAIL_OPACITY} />
      <circle cx="14" cy="15.5" r="1.15" fill="var(--background)" opacity={DETAIL_OPACITY} />
      <circle cx="12" cy="5.3" r="1.6" fill="currentColor" />
      <path d="M12 6.9v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4.5 11h3M4.5 16h3M16.5 11h3M16.5 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2.5l3 6.6 7 .9-5.2 5 1.4 7-6.2-3.6-6.2 3.6 1.4-7-5.2-5 7-.9z" />
      {/* 우상단 작은 반짝임 — 큰 별 하나만 있을 때보다 "인기·주목" 느낌을 보강한다 */}
      <path d="M18.2 3.2l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" opacity={DETAIL_OPACITY} />
    </svg>
  )
}

const ICON_MAP: Record<ExplorePresetIconKey, (props: IconProps) => React.JSX.Element> = {
  sprout: SproutIcon,
  doc: DocIcon,
  bug: BugIcon,
  star: StarIcon,
}

export function ExplorePresetIcon({ icon, className }: { icon: ExplorePresetIconKey; className?: string }) {
  const Icon = ICON_MAP[icon]
  return <Icon className={className} />
}
