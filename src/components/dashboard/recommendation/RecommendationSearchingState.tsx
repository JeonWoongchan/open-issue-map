type IconProps = {
  className?: string
}

// 얇은 lucide Search 아이콘 대신 통통한 몸체 + 반투명 렌즈 + 하이라이트를 가진 전용 아이콘 —
// "귀여운 돋보기"로 그려달라는 요청에 맞춘 손그림 SVG라 lucide-react에 없다.
function CuteSearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="11.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="4" />
      <ellipse cx="12" cy="11.5" rx="3.6" ry="2.1" fill="#fff" fillOpacity="0.8" transform="rotate(-28 12 11.5)" />
      <line x1="24.3" y1="24.3" x2="35" y2="35" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" />
    </svg>
  )
}

function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 1c0 4.6-1.2 6.9-3.4 9.1S3.6 13.4 1 13.4c4.6 0 6.9 1.2 9.1 3.4S13.4 20.4 13.4 23c0-4.6 1.2-6.9 3.4-9.1s4.6-2.4 7.2-2.4c-4.6 0-6.9-1.2-9.1-3.4S12 3.6 12 1z" />
    </svg>
  )
}

export type SearchingPhrase = { text: string; animationClass: string }
export type SearchingFinalPhrase = { text: string; delayClass: string }

// 실제 조회는 서버 컴포넌트 안에서 한 번에 끝나는 요청이라 클라이언트가 몇 % 왔는지 알 방법이
// 없다 — 그래서 진행률 대신 순서 무관한 문구를 차례로 보여준다. 앞 3개는 3초씩, 4번째는
// 6초간(9~15초) 늘려 붙여서 마지막 문구("오래 걸리고 있어요")가 정확히 15초부터 나오게
// 하고 그 사이 빈 문구 구간이 없게 한다. 앞 4개는 한 번씩만 등장하고(반복 없음), 마지막
// 문구는 15초 시점에 나타난 뒤 응답이 올 때까지 계속 떠 있는다.
const RECOMMENDATION_SEARCHING_PHRASES: SearchingPhrase[] = [
  { text: '관심 언어로 이슈를 찾고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:0s]' },
  { text: '저장소 활동을 살펴보고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:3s]' },
  { text: '난이도와 적합도를 확인하고 있어요', animationClass: 'recommendation-searching-copy [animation-delay:6s]' },
  { text: '마지막으로 다듬는 중이에요', animationClass: 'recommendation-searching-copy-slow [animation-delay:9s]' },
]

const RECOMMENDATION_SEARCHING_FINAL_PHRASE: SearchingFinalPhrase = {
  text: '거의 다 됐어요, 잠시만 기다려 주세요',
  delayClass: '[animation-delay:15s]',
}

type RecommendationSearchingStateProps = {
  phrases?: SearchingPhrase[]
  finalPhrase?: SearchingFinalPhrase
}

// "새로 추천받기" 진행 중 카드 자리에 대신 표출하는 상태. 캐러셀 영역 안에서 가로 가운데 정렬.
// phrases/finalPhrase를 넘기면 같은 아이콘·타이밍 연출을 다른 로딩 문맥(예: 이슈 상세의 AI 가이드
// 분석 중 상태)에서도 그대로 재사용할 수 있다 — 기본값은 추천 이슈 문구 그대로다.
export function RecommendationSearchingState({
  phrases = RECOMMENDATION_SEARCHING_PHRASES,
  finalPhrase = RECOMMENDATION_SEARCHING_FINAL_PHRASE,
}: RecommendationSearchingStateProps = {}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative flex h-14 w-14 items-end justify-center pb-2">
        <CuteSearchIcon className="recommendation-searching-icon relative h-[38px] w-[38px] text-interactive-action" />
        <SparkleIcon className="recommendation-searching-sparkle absolute -top-0.5 -right-1.5 h-[9px] w-[9px] text-bookmark-action [animation-delay:0.05s]" />
        <SparkleIcon className="recommendation-searching-sparkle absolute bottom-3.5 -left-2 h-[9px] w-[9px] text-bookmark-action [animation-delay:0.55s]" />
        <div className="recommendation-searching-shadow absolute bottom-1 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-foreground/[0.13]" />
      </div>
      <div className="relative h-4 w-72">
        {phrases.map(({ text, animationClass }) => (
          <p
            key={text}
            className={`${animationClass} absolute inset-0 flex items-center justify-center whitespace-nowrap text-center text-xs font-medium text-muted-foreground`}
          >
            {text}
          </p>
        ))}
        <p
          className={`recommendation-searching-copy-final ${finalPhrase.delayClass} absolute inset-0 flex items-center justify-center whitespace-nowrap text-center text-xs font-medium text-muted-foreground`}
        >
          {finalPhrase.text}
        </p>
      </div>
    </div>
  )
}
