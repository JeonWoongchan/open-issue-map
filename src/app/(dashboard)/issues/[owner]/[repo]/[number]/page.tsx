import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookOpen, FolderTree } from 'lucide-react'
import { AiGuideSection } from '@/components/issue-detail/AiGuideSection'
import { ComingSoonNotice } from '@/components/issue-detail/ComingSoonNotice'
import { ContributionRulesPanel } from '@/components/issue-detail/ContributionRulesPanel'
import { DetailPanel } from '@/components/issue-detail/DetailPanel'
import { IssueDetailActions } from '@/components/issue-detail/IssueDetailActions'
import { IssueDetailHeader } from '@/components/issue-detail/IssueDetailHeader'
import { IssueDetailWorkspace } from '@/components/issue-detail/IssueDetailWorkspace'
import { RelatedIssuesPanel } from '@/components/issue-detail/RelatedIssuesPanel'
import { ScoreBreakdownPanel } from '@/components/issue-detail/ScoreBreakdownPanel'
import { WhyItFitsCallout } from '@/components/issue-detail/WhyItFitsCallout'
import { GUEST_ONBOARDING_PROFILE } from '@/constants/guest-profile'
import { auth } from '@/lib/auth'
import { getServerAccessToken } from '@/lib/auth-utils'
import { getCachedIssueGuide } from '@/lib/ai/issue-guide-cache'
import { listUserBookmarkKeys } from '@/lib/bookmarks'
import { getContributionRules } from '@/lib/github/contribution-rules'
import { fetchIssueDetail } from '@/lib/github/issues/detail'
import { fetchRepoIssues } from '@/lib/github/issues/search'
import { scoreIssue } from '@/lib/github/issues/scorer'
import { createPageMetadata } from '@/lib/metadata'
import { loadOnboardingProfile } from '@/lib/user/profile'
import type { IssueCardItem } from '@/types/issue'

type IssueDetailPageParams = { owner: string; repo: string; number: string }
type IssueDetailPageProps = { params: Promise<IssueDetailPageParams> }

// 카드 목록에서 넘어온 관심사에 편중되지 않게 넉넉히 잡되, 저장소당 이슈가 몇 개 안 되는 경우도 많아 과하게 크게는 안 잡는다.
const RELATED_ISSUES_LIMIT = 6

export async function generateMetadata({ params }: IssueDetailPageProps): Promise<Metadata> {
  const { owner, repo, number } = await params
  return createPageMetadata({
    title: `${owner}/${repo} #${number}`,
    description: `${owner}/${repo} 저장소의 이슈 상세 정보와 매칭 점수를 확인합니다.`,
    canonicalPath: `/issues/${owner}/${repo}/${number}`,
  })
}

// (main) 레이아웃 밖, (dashboard) 라우트 그룹에 배치 — 비로그인 접근을 허용하고
// AI 라우트와 동일하게 GUEST_ONBOARDING_PROFILE + 서버 GitHub 토큰 폴백 패턴을 쓴다.
export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { owner, repo, number: numberParam } = await params
  const number = Number(numberParam)
  if (!Number.isInteger(number)) {
    notFound()
  }

  const session = await auth()
  const accessToken = session ? await getServerAccessToken() : (process.env.GITHUB_TOKEN ?? null)
  if (!accessToken) {
    // GitHub 토큰 자체가 없는 건 "이슈가 없음"이 아니라 서버 설정 문제 — notFound()로 감추지 않고
    // error.tsx 경계로 넘겨 실제 원인이 드러나게 한다.
    throw new Error('GitHub 액세스 토큰을 확인할 수 없습니다.')
  }

  const repoFullName = `${owner}/${repo}`

  // fetchRepoIssues는 rawIssue 등 아래 결과에 의존하지 않으므로 나머지와 함께 병렬로 묶는다.
  const [rawIssue, profile, bookmarkKeys, contributionRules, relatedIssues] = await Promise.all([
    fetchIssueDetail(owner, repo, number, accessToken),
    session
      ? loadOnboardingProfile(session.user.id).then((p) => p ?? GUEST_ONBOARDING_PROFILE)
      : Promise.resolve(GUEST_ONBOARDING_PROFILE),
    session ? listUserBookmarkKeys(session.user.id) : Promise.resolve<string[]>([]),
    getContributionRules(owner, repo),
    fetchRepoIssues(repoFullName, accessToken, RELATED_ISSUES_LIMIT, number),
  ])

  if (!rawIssue) {
    notFound()
  }

  const scored = scoreIssue(rawIssue, profile)
  const issue: IssueCardItem = {
    ...scored,
    isBookmarked: bookmarkKeys.includes(`${scored.repoFullName}#${scored.number}`),
  }

  // AiGuideSection에 넘겨 캐시가 이미 있으면 클라이언트가 다시 요청하지 않고 바로 렌더링하게 한다 —
  // rawIssue.updatedAt이 있어야 캐시 키를 만들 수 있어 위 Promise.all에는 넣을 수 없다.
  const initialAnalysis = await getCachedIssueGuide(
    { cacheUserId: session?.user.id ?? 'guest', repoFullName, issueNumber: issue.number },
    rawIssue.updatedAt,
  )

  return (
    <div className="issue-detail-grid">
      <div className="issue-detail-grid__header">
        <IssueDetailHeader issue={issue} />
      </div>

      <div className="issue-detail-grid__callout">
        {issue.scoreBreakdown ? <WhyItFitsCallout scoreBreakdown={issue.scoreBreakdown} /> : null}
      </div>

      <div className="issue-detail-grid__sidebar">
        {issue.score !== null && issue.scoreBreakdown ? (
          <ScoreBreakdownPanel score={issue.score} scoreBreakdown={issue.scoreBreakdown} />
        ) : null}
        <IssueDetailActions issue={issue} isGuest={!session} />
      </div>

      <div className="issue-detail-grid__main">
        <IssueDetailWorkspace
          overview={
            <>
              <DetailPanel icon={BookOpen} label="저장소 개요">
                <ComingSoonNotice description="README 요약" />
              </DetailPanel>

              <DetailPanel icon={FolderTree} label="코드 구조 · 스택">
                <ComingSoonNotice description="파일 구조와 기술 스택 분석" />
              </DetailPanel>

              <ContributionRulesPanel rules={contributionRules} />
            </>
          }
          aiGuide={
            <AiGuideSection
              title={issue.title}
              body={issue.body ?? null}
              labels={issue.labels}
              language={issue.language}
              repoFullName={issue.repoFullName}
              issueNumber={issue.number}
              issueUpdatedAt={rawIssue.updatedAt}
              initialAnalysis={initialAnalysis}
            />
          }
          related={<RelatedIssuesPanel issues={relatedIssues} />}
        />
      </div>
    </div>
  )
}
