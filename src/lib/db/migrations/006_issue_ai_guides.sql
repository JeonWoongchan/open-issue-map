-- 이슈 상세 페이지 AI 가이드 캐시. 유저(로그인 시 실제 user.id, 게스트는 공용 'guest')별로
-- 저장한다 — 프롬프트에 유저 프로필(경험 수준·목적·시간)이 들어가 개인화된 결과가 나오므로
-- 이슈 하나로 캐시를 공유하지 않는다. 게스트는 모두 같은 기본 프로필을 쓰므로 'guest' 한 키를
-- 공유해도 무방하다(첫 게스트 방문자만 실제 생성, 이후 게스트는 캐시로 즉시 응답).
CREATE TABLE issue_ai_guides (
  cache_user_id    TEXT        NOT NULL,
  repo_full_name   TEXT        NOT NULL,
  issue_number     INT         NOT NULL,
  -- 캐시 생성 시점 GitHub 이슈의 updatedAt — 다음 조회 때 새로 가져온 값과 다르면
  -- (제목/본문/라벨 수정, 새 댓글 등으로 이슈가 바뀐 것이므로) 캐시를 무효화하고 재생성한다.
  issue_updated_at TIMESTAMPTZ NOT NULL,
  analysis         JSONB       NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cache_user_id, repo_full_name, issue_number)
);
