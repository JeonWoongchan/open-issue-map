import type { ReactNode } from 'react'
import { SearchBar } from './SearchBar'

type SearchBarRowProps = {
    value: string
    onChangeAction: (value: string) => void
    resultCount?: number
    placeholder?: string
    helpSlot?: ReactNode
}

export function SearchBarRow({
    value,
    onChangeAction,
    resultCount,
    placeholder,
    helpSlot,
}: SearchBarRowProps) {
    return (
        <div className="flex items-center gap-2">
            <SearchBar
                value={value}
                onChangeAction={onChangeAction}
                resultCount={resultCount}
                placeholder={placeholder}
                className="flex-1"
            />
            {helpSlot}
        </div>
    )
}
