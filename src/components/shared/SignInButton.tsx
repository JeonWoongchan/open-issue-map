'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComponentPropsWithoutRef } from 'react'

type SignInButtonProps = Omit<ComponentPropsWithoutRef<typeof Button>, 'type' | 'children'> & {
    pendingText?: string
    showIcon?: boolean
}

// useFormStatus로 Server Action 진행 상태를 감지해 로딩 UI를 표시한다
export function SignInButton({
    pendingText = '연결 중...',
    showIcon = false,
    disabled,
    ...props
}: SignInButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending || disabled} {...props}>
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {pendingText}
                </>
            ) : (
                <>
                    {showIcon && <LogIn className="h-4 w-4" />}
                    GitHub으로 로그인
                </>
            )}
        </Button>
    )
}
