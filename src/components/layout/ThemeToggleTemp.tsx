'use client'

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 임시 컴포넌트 — 디자인 리뉴얼 작업 중 라이트/다크 비교용. 정식 테마 설정이 생기면 제거.
export function ThemeToggleTemp() {
  const [isDark, setIsDark] = useState(true)

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      onClick={toggle}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
