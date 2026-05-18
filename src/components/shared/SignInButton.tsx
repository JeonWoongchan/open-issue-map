'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComponentPropsWithoutRef } from 'react'

type SignInButtonProps = Omit<ComponentPropsWithoutRef<typeof Button>, 'type'> & {
    pendingText?: string
}

// useFormStatus로 Server Action 진행 상태를 감지해 로딩 UI를 표시한다
export function SignInButton({
    children,
    pendingText = '연결 중...',
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
            ) : children}
        </Button>
    )
}
