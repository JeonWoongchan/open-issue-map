import { Separator } from '@/components/ui/separator'
import { FileText } from 'lucide-react'
import { ReactNode } from 'react'

function Section({
    number,
    title,
    children,
}: {
    number: number
    title: string
    children: ReactNode
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-interactive-selected text-[10px] font-semibold text-interactive-selected-foreground">
                    {number}
                </span>
                <span className="text-sm font-semibold text-foreground">{title}</span>
            </div>
            {children}
        </div>
    )
}

function StepRow({ label, description }: { label: string; description: string }) {
    return (
        <tr className="border-t border-border/60 first:border-t-0">
            <td className="w-1/3 px-3 py-2 font-medium text-foreground">{label}</td>
            <td className="px-3 py-2 text-muted-foreground">{description}</td>
        </tr>
    )
}

function DocItem({ filename, description }: { filename: string; description: string }) {
    return (
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
                <p className="mb-0.5 font-semibold text-foreground">{filename}</p>
                <p className="leading-5 text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

export function DashboardContributionGuide() {
    return (
        <div className="space-y-5">
            <p className="text-xs leading-5 text-muted-foreground">
                오픈소스에 처음 기여할 때 따르는 일반적인 흐름입니다. 레포마다 규칙이 다를 수 있으니 항상 해당 레포의 문서를 먼저 확인하세요.
            </p>

            {/* 1. 이슈 찾기 & 클레임 */}
            <Section number={1} title="이슈 찾기 & 클레임">
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                        <tbody>
                            <StepRow label="이슈 탐색" description="Issues 탭에서 good first issue 라벨이 붙은 이슈를 찾는다." />
                            <StepRow label="담당자 지정" description="이슈 댓글에 작업 의사를 남겨 관리자에게 assignee 지정을 요청한다." />
                        </tbody>
                    </table>
                </div>
            </Section>

            <Separator />

            {/* 2. 레포 준비 */}
            <Section number={2} title="레포 준비">
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                        <tbody>
                            <StepRow label="Fork" description="원본 레포를 본인 GitHub 계정으로 Fork한다." />
                            <StepRow label="Clone & remote" description="Fork 레포를 클론하고, 원본 레포를 upstream으로 등록한다." />
                            <StepRow label="브랜치 생성" description="main에 직접 커밋하지 않고 feat/<작업내용> 브랜치에서 작업한다." />
                        </tbody>
                    </table>
                </div>
            </Section>

            <Separator />

            {/* 3. 코드 수정 전 문서 확인 */}
            <Section number={3} title="코드 수정 전 — 레포 문서 확인">
                {/* 핵심 안내 */}
                <div className="flex items-start gap-2 rounded-lg border border-interactive-selected/40 bg-interactive-selected/10 px-3 py-2.5 text-xs text-foreground">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-interactive-action" />
                    <p className="leading-5">
                        코드를 수정하기 전에 반드시 아래 문서를 확인한다. 레포별 규칙이 이 가이드보다 우선한다.
                    </p>
                </div>
                <div className="space-y-2">
                    <DocItem filename="CONTRIBUTING.md" description="기여 방법, 브랜치 전략, 커밋 컨벤션 등 가장 상세한 기여 안내" />
                    <DocItem filename="README.md" description="프로젝트 개요, 개발 환경 설정, 실행 방법" />
                    <DocItem filename=".github/PULL_REQUEST_TEMPLATE.md" description="PR 작성 양식 — 이 형식에 맞춰 PR을 작성한다" />
                    <DocItem filename="CODE_OF_CONDUCT.md" description="커뮤니티 행동 강령" />
                </div>
            </Section>

            <Separator />

            {/* 4. 커밋 & PR */}
            <Section number={4} title="커밋 & PR">
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                        <tbody>
                            <StepRow label="코드 스타일" description="기존 코드의 들여쓰기·따옴표 방식을 그대로 맞춘다." />
                            <StepRow label="커밋 형식" description="Conventional Commits 형식 사용 — feat / fix / docs / style / chore 등" />
                            <StepRow label="검증" description="npm run check 또는 레포에서 안내하는 명령으로 타입·린트 오류를 확인한다." />
                            <StepRow label="PR 생성" description="base를 원본 레포 main으로 설정하고, Closes #이슈번호로 이슈를 연결한다." />
                        </tbody>
                    </table>
                </div>
            </Section>

            <Separator />

            {/* 5. 머지 후 정리 */}
            <Section number={5} title="머지 후 정리">
                <p className="text-xs leading-5 text-muted-foreground">
                    PR이 머지되면 Fork 레포를 삭제해도 된다. 기여 기록은 원본 레포 커밋 히스토리에 본인 계정으로 남는다.
                    같은 레포에 계속 기여할 계획이라면 Fork를 유지하고{' '}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">git fetch upstream</code>으로 동기화해서 사용한다.
                </p>
            </Section>
        </div>
    )
}
