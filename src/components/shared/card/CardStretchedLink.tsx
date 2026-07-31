import Link from 'next/link'

type CardStretchedLinkProps = {
  href: string
  label: string
}
export function CardStretchedLink({ href, label }: CardStretchedLinkProps) {
  return <Link href={href} aria-label={label} prefetch={false} className="absolute inset-0 z-0" />
}
