import type { ReactNode } from 'react'
import { SearchBar } from './SearchBar'

type SearchBarRowProps = {
    value: string
    onChangeAction: (value: string) => void
    resultCount?: number
    totalCount?: number
    placeholder?: string
    filterSlot?: ReactNode
    helpSlot?: ReactNode
}

export function SearchBarRow({ filterSlot, helpSlot, ...searchBarProps }: SearchBarRowProps) {
    return (
        <div className="flex items-center gap-2">
            <SearchBar {...searchBarProps} className="w-full max-w-xs" />
            <div className="ml-auto flex shrink-0 items-center gap-2">
                {filterSlot}
                {helpSlot}
            </div>
        </div>
    )
}
