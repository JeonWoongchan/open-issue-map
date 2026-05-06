# Scoring Rules

이 문서는 현재 `src/constants/scoring-rules.ts`와 `src/lib/github/issues/scorer.ts`, `ranking.ts`, `repo-health/calculate.ts` 기준의 추천 규칙을 설명한다.

## 기본 설정

| 항목 | 값 | 설명 |
| --- | --- | --- |
| `PAGE_SIZE` | `10` | API page 크기 |
| `GITHUB_API_CACHE_TTL_SECONDS` | `60` | GitHub API server cache TTL |
| `GITHUB_API_TIMEOUT_MS` | `8000` | GitHub API timeout |
| `REPO_HEALTH_CACHE_TTL_HOURS` | `1` | repo health DB cache TTL |
| `HEALTH_THRESHOLD` | `50` | ranking에서 낮은 health 저장소 필터 기준 |
| `SCORE_FILTER_THRESHOLDS` | `10, 20, 30, 40, 50, 60, 70, 80, 90` | UI 최소 점수 필터 |
| `STAR_FILTER_THRESHOLDS` | `100, 500, 1000, 5000` | UI 최소 스타 수 필터 |

## 추천 데이터 흐름

1. 온보딩 프로필을 로드한다.
2. GitHub issue search로 언어별 후보 이슈를 가져온다.
3. 중복 이슈를 URL 기준으로 제거한다.
4. 저장소 health score를 조회한다.
5. `scoreIssue()`로 각 이슈를 점수화한다.
6. `rankIssues()` 내부에서 health 임계값 미달 저장소와 주간 시간 기준 허용 기여 유형을 필터링한다.
7. score 우선, 동점이면 deterministic hash 기준으로 정렬한다.
8. `applyFilters()`가 사용자 선택 API query filter(언어, 난이도, 기여 유형, 최소 점수, 최소 스타 수)를 적용하고 page를 잘라 반환한다.
9. 활성 필터가 있고 반환 결과가 PAGE_SIZE에 미달하면 `canLoadMoreCandidates: true`를 설정해 자동 batch 교체를 중단한다.

## 스타 수 필터

`IssueFilters.minStars`는 저장소의 `stargazerCount`를 기준으로 이슈를 걸러낸다.

허용 값: `100 | 500 | 1000 | 5000`

`hasActiveFilters()` (`src/lib/github/issues/filters.ts`)가 language, difficultyLevel, contributionTypes, minScore, minStars 중 하나라도 활성화되어 있는지 판단한다. 이 함수는 서비스 레이어에서 `canLoadMoreCandidates` 계산에도 사용한다.

## 언어 점수

사용자 선호 언어와 저장소 primary language를 비교한다.

| Match | Score |
| --- | --- |
| primary exact | `20` |
| secondary exact | `18` |
| other selected exact | `16` |
| primary related | `11` |
| secondary related | `9` |
| other selected related | `7` |
| no match | `0` |

관련 언어 그룹:

- `TypeScript`, `JavaScript`
- `Python`, `Jupyter Notebook`
- `C`, `C++`, `C#`
- `Java`, `Kotlin`, `Scala`

## 난이도 점수

GitHub issue에는 공식 난이도 필드가 없으므로 label, title, body keyword로 난이도를 추정한다.

경험 순서:

```text
beginner -> junior -> mid -> senior
```

주요 keyword:

- `beginner`: `good first issue`, `beginner`, `starter`
- `junior`: `help wanted`, `easy`
- `mid`: `medium`, `moderate`, `intermediate`
- `senior`: `hard`, `complex`, `advanced`, `needs-investigation`

사용자 경험과 이슈 난이도가 가까울수록 높은 점수를 준다.

## 기여 유형 점수

기여 유형은 label, title, body keyword로 추정한다.

| 유형 | 주요 keyword |
| --- | --- |
| `doc` | documentation, docs, readme, translation, i18n |
| `bug` | bug, fix, regression, defect, error |
| `feat` | feature, enhancement, proposal |
| `test` | test, testing, coverage, qa |
| `review` | review, feedback |

점수:

- primary match: `14`
- secondary match: `12`
- other selected match: `10`
- related match: `5`
- no match: `0`

관련 유형:

- `doc`: `test`, `review`
- `bug`: `test`, `feat`
- `feat`: `bug`, `test`
- `test`: `bug`, `feat`
- `review`: `doc`, `test`

## 경쟁도 점수

경쟁도는 댓글 수와 연결된 PR 존재 여부로 추정한다.

Competition level:

- `OPEN`: 진입 경쟁 낮음
- `ACTIVE`: 논의가 어느 정도 있음
- `HAS_PR`: 이미 PR이 연결됨

경험 수준에 따라 bonus/penalty가 다르다.

- beginner는 `OPEN`을 선호하고 `HAS_PR`에 큰 penalty
- mid/senior는 `ACTIVE` 이슈도 높은 점수를 받을 수 있음

## 주간 시간 규칙

사용자가 투입 가능한 시간에 맞춰 과도한 작업을 줄인다.

| Weekly hours | 허용 기여 유형 |
| --- | --- |
| `2` | `doc`, `bug` |
| `5` | `doc`, `bug`, `test` |
| `10` | `doc`, `bug`, `test`, `feat`, `review` |

`TIME_BUDGET_RULES`는 유형, 난이도, 댓글 수, 연결 PR 여부에 bonus/penalty를 준다.

## 목적 점수

온보딩 목적에 따라 다른 이슈를 선호한다.

### `portfolio`

- 결과물을 설명하기 쉬운 이슈 선호
- 인지도 있는 저장소에 bonus
- 연결 PR이 있는 이슈에 penalty
- 선호 유형: `doc`, `bug`, `feat`

### `growth`

- 학습 효과가 큰 기능/테스트/버그 이슈 선호
- 약간 도전적인 난이도 허용
- 선호 유형: `feat`, `test`, `bug`

### `community`

- 유지보수가 활발하고 꾸준히 참여하기 좋은 저장소 선호
- 선호 유형: `doc`, `bug`, `test`

## Repo Health

저장소 health score는 0~100 범위다.

| 요소 | 최대 점수 |
| --- | --- |
| 최근 commit | `30` |
| PR 응답 속도 | `30` |
| PR merge rate | `25` |
| maintainer response | `15` |

계산 위치:

- `src/lib/github/repo-health/calculate.ts`

캐시:

- `repo_health_cache`
- TTL: `REPO_HEALTH_CACHE_TTL_HOURS`

추천 bonus:

- excellent: `85+`
- high: `70+`
- mid: `55+`
- low: `40+`

## 정렬 안정성

동점 이슈는 `userId:batchParam:issue.url` 기반 hash로 정렬한다. 같은 사용자와 batch에서는 page 이동 시 순서가 안정적으로 유지된다.

## 변경 시 체크리스트

점수 규칙을 바꾸면 다음을 함께 확인한다.

1. `src/constants/scoring-rules.ts`
2. `src/lib/github/issues/scorer.ts`
3. `src/lib/github/issues/ranking.ts`
4. `src/lib/github/issues/filters.ts` (필터 허용값·`hasActiveFilters` 포함)
5. 관련 테스트:
   - `scorer.test.ts`
   - `service.test.ts`
   - `filters.test.ts`
6. 이 문서
