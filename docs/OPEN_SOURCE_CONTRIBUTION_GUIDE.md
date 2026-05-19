# 오픈소스 첫 기여 가이드

처음 오픈소스에 기여하는 사람을 위한 일반적인 프로세스 정리.
모든 레포에 동일하게 적용되진 않지만, 대부분의 프로젝트에서 통용되는 흐름이다.

---

## 1. 이슈 찾기

- GitHub 레포의 **Issues** 탭에서 `good first issue` 라벨이 붙은 이슈를 찾는다.
- 이슈 내용을 읽고 무엇을 해야 하는지 파악한다.

---

## 2. 이슈 클레임 (담당자 지정)

- 이슈 댓글에 **"I'd like to work on this issue!"** 같은 내용을 달아 본인이 할 것임을 알린다.
- 관리자가 댓글을 보고 assignee(담당자)로 지정해준다.
- assign 받았더라도 다른 사람이 먼저 PR을 올릴 수 있으니, 가능하면 빠르게 진행한다.

---

## 3. 레포 준비

```bash
# 1. 원본 레포를 본인 GitHub 계정으로 Fork
# GitHub 레포 페이지 우측 상단 Fork 버튼 클릭

# 2. Fork한 레포를 로컬에 클론
git clone https://github.com/<본인계정>/<레포명>.git
cd <레포명>

# 3. 원본 레포를 upstream으로 등록 (동기화용)
git remote add upstream https://github.com/<원본계정>/<레포명>.git

# 4. 의존성 설치
npm install
```

---

## 4. 브랜치 생성

작업은 항상 새 브랜치에서 한다. `main` 브랜치에 직접 커밋하지 않는다.

```bash
git checkout -b feat/<작업내용>
# 예: git checkout -b feat/mountain-onsen-theme
```

---

## 5. 코드 수정

코드를 수정하기 전에 레포의 기여 관련 문서를 먼저 확인한다.

**확인할 문서 목록 (우선순위 순):**

1. `CONTRIBUTING.md` — 기여 방법, 브랜치 전략, 커밋 컨벤션 등 상세 안내
2. `README.md` — 프로젝트 개요, 개발 환경 설정, 실행 방법
3. `.github/PULL_REQUEST_TEMPLATE.md` — PR 작성 양식
4. `CODE_OF_CONDUCT.md` — 커뮤니티 행동 강령

> 레포마다 코드 스타일, 커밋 형식, 테스트 요구사항, PR 규칙이 다를 수 있다.
> 위 문서에 명시된 규칙이 이 가이드보다 우선한다.

**수정 시 주의사항:**

- 이슈에서 요구하는 내용을 정확히 수정한다.
- 임의로 내용을 변경하지 않는다 (색상값, ID 등 이슈에서 지정한 값은 그대로 사용).
- 기존 코드 스타일(들여쓰기, 따옴표 방식 등)을 맞춘다.

---

## 6. 검증

```bash
npm run check
```

- TypeScript 타입 에러, ESLint 경고 등을 확인한다.
- **본인이 수정한 코드에서 발생한 에러**가 없으면 OK.
- 기존 프로젝트에 원래 있던 경고는 무시해도 된다.

---

## 7. 커밋

Conventional Commits 형식을 따른다.

```bash
git add <수정한 파일>
git commit -m "feat(scope): 변경 내용 설명"
```

**커밋 타입 예시:**

| 타입 | 설명 |
|------|------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `content` | 데이터/콘텐츠 추가 |
| `style` | UI/스타일 변경 |
| `chore` | 빌드, 설정 변경 |

---

## 8. 푸시

Fork한 본인 레포로 푸시한다.

```bash
git push origin feat/<작업내용>
```

---

## 9. Pull Request 생성

1. GitHub에서 Fork한 본인 레포 페이지를 열면 **"Compare & pull request"** 버튼이 뜬다.
2. base 설정 확인:
  - **base repository**: 원본 레포 / **base**: `main`
  - **head repository**: 본인 Fork 레포 / **compare**: 작업 브랜치
3. PR 템플릿을 작성한다.

**PR 템플릿 작성 요령:**

- **Description**: 무엇을 왜 변경했는지 간단히 설명
- **Related Issue**: `Closes #이슈번호` 형식으로 이슈 연결 (PR 머지 시 이슈 자동 닫힘)
- **Checklist**: 해당하는 항목 체크 (`[x]`), 해당 없으면 `[ ]` 유지
- **Type of Change**: 변경 타입 선택
- **How Has This Been Tested**: 어떻게 검증했는지 작성

---

## 10. 리뷰 대기 및 머지

- PR 제출 후 CI 자동 검사가 통과하는지 확인한다.
- 관리자가 리뷰 후 머지해준다.
- 머지되면 이메일/GitHub 알림이 온다.

---

## 11. Fork 정리 (선택)

PR이 **머지된 후** Fork한 레포를 삭제해도 된다.
기여 기록은 원본 레포 커밋 히스토리에 본인 계정으로 남는다.

> ⚠️ 머지 전에 Fork를 삭제하면 PR도 함께 닫힌다.

같은 레포에 계속 기여할 계획이라면 Fork를 유지하고 동기화해서 사용한다:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## 참고

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Docs - Fork a repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
- [GitHub Docs - Creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
