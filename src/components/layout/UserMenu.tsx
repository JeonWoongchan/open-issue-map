"use client"

import Link from 'next/link'
import { Bookmark, LogOut, Menu, GitPullRequest, UserRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type UserMenuProps = {
  logoutAction: () => Promise<void>
}

export function UserMenu({ logoutAction }: UserMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="shrink-0 cursor-pointer rounded-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <Menu className="size-5" />
        <span className="sr-only">메뉴 열기</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12}>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound />
            마이페이지
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pr-history">
            <GitPullRequest />
            PR 히스토리
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/bookmarks">
            <Bookmark />
            북마크
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => logoutAction()}
        >
          <LogOut />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
