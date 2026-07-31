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
                이슈 상세 페이지에 들어가면 AI가 이슈 정보와 온보딩 설문 답변을 함께 분석해
                &quot;이슈 개요&quot; · &quot;AI 가이드&quot; · &quot;기여 규칙&quot; 세 영역을 자동으로 채워줘요.
            </p>

            {/* 1. 분석에 사용하는 데이터 */}
            <HelpSection number={1} title="분석에 사용하는 데이터">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">이슈 정보</p>
                    <HelpDataTable>
                        <HelpTableRow label="이슈 제목" description="이슈의 핵심 맥락을 파악하는 기본 입력값" />
                        <HelpTableRow label="이슈 본문" description="재현 방법, 예상 동작, 제안 내용 등 상세 정보" />
                        <HelpTableRow label="라벨" description="기여 유형 추정에 사용하는 태그 목록" />
                        <HelpTableRow label="저장소 언어" description="필요한 개념과 작업 범위 추론에 활용" />
                        <HelpTableRow label="README" description="프로젝트 구조와 개발 환경을 파악하기 위해 포함 (제공된 경우)" />
                        <HelpTableRow label="CONTRIBUTING.md" description="커밋 컨벤션·CLA 여부 판단에 사용 (저장소에 있는 경우)" />
                    </HelpDataTable>
                    <p className="text-xs font-medium text-foreground">온보딩 설문 정보</p>
                    <HelpDataTable>
                        <HelpTableRow label="경험 수준" description="안내 문장의 눈높이를 조정하는 기준 (입문·초급·중급·고급)" />
                        <HelpTableRow label="기여 목적" description="안내 방향을 결정하는 맥락 (포트폴리오·성장·커뮤니티)" />
                        <HelpTableRow label="주간 투입 시간" description="작업 범위 서술의 기준으로 활용 (주 2·5·10시간)" />
                    </HelpDataTable>
                </div>
            </HelpSection>

            <Separator />

            {/* 2. 이슈 개요 */}
            <HelpSection number={2} title="이슈 개요">
                <p className="text-xs leading-5 text-muted-foreground">
                    이슈가 무엇을 말하는지 AI가 한 줄 요약과 맥락 설명으로 먼저 정리해줘요. 그 아래는 두 탭으로
                    나뉘어요 — &quot;이슈 본문 요약&quot;은 AI가 원문 섹션 구조를 살려 압축한 요약이고, &quot;본문 전체&quot;는
                    GitHub 원문을 그대로 마크다운으로 보여줘요(AI 미개입).
                </p>
            </HelpSection>

            <Separator />

            {/* 3. AI 가이드 */}
            <HelpSection number={3} title="AI 가이드">
                <div className="space-y-2">
                    <OutputRow
                        label="필요한 개념"
                        description="이슈 해결에 필요한 핵심 기술과 개념을 2~4가지 항목으로 정리해줘요."
                    />
                    <OutputRow
                        label="작업 범위"
                        description="어느 정도 작업량인지, 어떤 영역을 건드리는지 1~2문장으로 요약해줘요."
                    />
                    <OutputRow
                        label="시작 지점"
                        description="관련 기능을 담당할 파일·모듈의 역할 중심 위치를 2~3개 안내해줘요. 이슈 내용과 README를 바탕으로 추론하니 실제 경로와 다를 수 있어요."
                    />
                    <OutputRow
                        label="주의할 점"
                        description="놓치기 쉬운 엣지 케이스, 사이드 이펙트, 작업 전에 미리 파악해야 할 사항을 1~3개 정리해줘요."
                    />
                    <OutputRow
                        label="기대 효과"
                        description="이 이슈에 기여하면 어떤 학습·포트폴리오 효과를 얻을 수 있는지 설명해줘요."
                    />
                </div>
            </HelpSection>

            <Separator />

            {/* 4. 기여 규칙 */}
            <HelpSection number={4} title="기여 규칙">
                <p className="text-xs leading-5 text-muted-foreground">
                    CONTRIBUTING.md·PR 템플릿 경로는 AI 판단이 아니라 저장소에서 실제 파일 존재 여부를 확인한
                    결과라서 항상 정확해요. 반면 커밋 컨벤션과 CLA(기여자 라이선스 동의) 필요 여부는 그 문서
                    내용을 AI가 읽고 판단한 서술이에요.
                </p>
            </HelpSection>

            <Separator />

            {/* 참고 안내 */}
            <div className="flex items-start gap-2 rounded-lg border border-status-warning-border bg-status-warning px-3 py-2.5 text-xs text-status-warning-foreground">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                    이슈 개요·AI 가이드·커밋 컨벤션과 CLA 판단은 모두 AI 추정이라 참고용이에요. 실제 코드 구조·파일
                    위치·기여 규칙과 다를 수 있으니 기여 전 반드시 저장소를 직접 확인해요.
                </p>
            </div>
        </div>
    )
}
