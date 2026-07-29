type ComingSoonNoticeProps = {
  description: string
}

// 백엔드 데이터 파이프라인(README 요약·파일 구조·기여 규칙 감지)이 아직 없는 패널의 자리표시자 —
// 없는 데이터를 지어내는 대신 정직하게 "아직 없음"을 표시한다.
export function ComingSoonNotice({ description }: ComingSoonNoticeProps) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-xs text-muted-foreground">
      {description} — 곧 추가될 예정이에요.
    </p>
  )
}
