import { REPORT_EMAIL } from '@/constants/app'

export function HelpReportFooter() {
    return (
        <p>
            문제나 버그를 발견하셨나요?{' '}
                {REPORT_EMAIL}
            {' '}으로 제보해 주세요.
        </p>
    )
}
