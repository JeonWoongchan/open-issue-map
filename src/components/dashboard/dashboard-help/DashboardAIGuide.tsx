import { Separator } from '@/components/ui/separator'
import { TriangleAlert } from 'lucide-react'
import { HelpSection, HelpTableRow, HelpDataTable } from './guide-components'

function OutputRow({ label, description }: { label: string; description: string }) {
    return (
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs">
            <p className="mb-0.5 font-semibold text-foreground">{label}</p>
            <p className="leading-5 text-muted-foreground">{description}</p>
        </div>
    )
}

export function DashboardAIGuide() {
    return (
        <div className="space-y-5">
            <p className="text-xs leading-5 text-muted-foreground">
                AI 작업 가이드는 이슈 정보와 온보딩 설문 답변을 함께 분석해 기여를 시작하는 데 필요한 정보를 정리해줍니다.
            </p>

            {/* 1. 분석에 사용하는 데이터 */}
            <HelpSection number={1} title="분석에 사용하는 데이터">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">이슈 정보</p>
                    <HelpDataTable>
                        <HelpTableRow label="이슈 제목" description="이슈의 핵심 맥락을 파악하는 기본 입력값" />
                        <HelpTableRow label="이슈 본문" description="재현 방법, 예상 동작, 제안 내용 등 상세 정보" />
                        <HelpTableRow label="라벨" description="난이도·기여 유형 추정에 사용하는 태그 목록" />
                        <HelpTableRow label="저장소 언어" description="필요한 개념과 작업 범위 추론에 활용" />
                        <HelpTableRow label="README" description="프로젝트 구조와 개발 환경을 파악하기 위해 포함 (제공된 경우)" />
                    </HelpDataTable>
                    <p className="text-xs font-medium text-foreground">온보딩 설문 정보</p>
                    <HelpDataTable>
                        <HelpTableRow label="경험 수준" description="예상 난이도를 상대적으로 조정하는 기준 (입문·초급·중급·고급)" />
                        <HelpTableRow label="기여 목적" description="안내 방향을 결정하는 맥락 (포트폴리오·성장·커뮤니티)" />
                        <HelpTableRow label="주간 투입 시간" description="작업 범위 서술의 기준으로 활용 (주 2·5·10시간)" />
                    </HelpDataTable>
                </div>
            </HelpSection>

            <Separator />

            {/* 2. 분석 결과 항목 */}
            <HelpSection number={2} title="분석 결과 항목">
                <div className="space-y-2">
                    <OutputRow
                        label="예상 난이도"
                        description="이슈의 절대 난이도가 아닌 내 경험 수준을 고려한 상대적 난이도입니다. 같은 이슈도 경험 수준에 따라 쉬움·보통·어려움이 달라질 수 있습니다."
                    />
                    <OutputRow
                        label="예상 작업 범위"
                        description="어느 정도 작업량인지, 어떤 영역을 건드리는지 1~2문장으로 요약합니다."
                    />
                    <OutputRow
                        label="필요한 개념"
                        description="이슈 해결에 필요한 핵심 기술과 개념을 2~4가지 항목으로 정리합니다."
                    />
                    <OutputRow
                        label="먼저 봐야 할 부분"
                        description="관련 기능을 담당할 파일·모듈의 역할 중심 위치를 2~3개 안내합니다. 이슈 내용과 README를 바탕으로 추론하므로 실제 경로와 다를 수 있습니다."
                    />
                    <OutputRow
                        label="주의할 점"
                        description="놓치기 쉬운 엣지 케이스, 사이드 이펙트, 작업 전에 미리 파악해야 할 사항을 1~3개 정리합니다."
                    />
                </div>
            </HelpSection>

            <Separator />

            {/* 참고 안내 */}
            <div className="flex items-start gap-2 rounded-lg border border-status-warning-border bg-status-warning px-3 py-2.5 text-xs text-status-warning-foreground">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>AI 분석은 참고용입니다. 실제 코드 구조·파일 위치와 다를 수 있으므로 기여 전 반드시 저장소를 직접 확인하세요.</p>
            </div>
        </div>
    )
}
