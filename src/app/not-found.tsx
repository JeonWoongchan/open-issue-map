import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold text-foreground">페이지를 찾을 수 없습니다.</p>
                <p className="text-sm text-muted-foreground">주소가 잘못되었거나 삭제된 페이지입니다.</p>
            </div>
            <Button variant="outline" asChild>
                <Link href="/">홈으로 돌아가기</Link>
            </Button>
        </div>
    )
}
