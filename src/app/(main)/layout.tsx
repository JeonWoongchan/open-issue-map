import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { MainHeader } from '@/components/layout/MainHeader'
import { PageContainer } from '@/components/layout/PageContainer'
import { auth } from '@/lib/auth'
import { createNoIndexMetadata } from '@/lib/metadata'
import { redirect } from 'next/navigation'

export const metadata: Metadata = createNoIndexMetadata()

export default async function MainLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/')

  // isOnboarded는 JWT에 저장된 값 — DB 조회 없이 확인
  if (!session.user.isOnboarded) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-background">
      <MainHeader image={session.user.image} name={session.user.name} />
      <PageContainer>{children}</PageContainer>
    </div>
  )
}
