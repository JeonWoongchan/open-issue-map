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
        <div className="flex flex-wrap items-center gap-2">
            <SearchBar {...searchBarProps} className="min-w-0 flex-1" />
            {filterSlot}
            {helpSlot}
        </div>
    )
}
