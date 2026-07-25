import Link from 'next/link'

type CardStretchedLinkProps = {
  href: string
  label: string
}

// CardShell의 relative CardContent를 기준으로 카드 전체를 클릭 가능하게 덮는 투명 링크.
// children 중 하나로 배치해서 쓴다 — CardShell은 이 링크의 존재 자체를 모른다.
export function CardStretchedLink({ href, label }: CardStretchedLinkProps) {
  return <Link href={href} aria-label={label} className="absolute inset-0 z-0" />
}
