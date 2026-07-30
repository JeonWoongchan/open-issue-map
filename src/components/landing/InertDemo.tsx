import type { ReactNode } from 'react'

export function InertDemo({ children }: { children: ReactNode }) {
    return (
        <div inert className="pointer-events-none w-full select-none">
            {children}
        </div>
    )
}
