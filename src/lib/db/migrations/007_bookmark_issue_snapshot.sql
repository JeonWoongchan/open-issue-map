-- 북마크 저장 시점의 이슈 카드 데이터 전체를 스냅샷으로 저장한다.
-- 이전엔 title/url만 저장하고 나머지(언어·라벨·댓글수·점수 등)는 목록 조회마다 GitHub에
-- 실시간으로 다시 물어봤는데, 이제는 저장 시점 스냅샷을 그대로 보여준다 — 그만큼 점수·
-- PR연결여부·댓글수 등은 북마크한 순간 값으로 고정되고 이후 갱신되지 않는다(사용자 결정).
-- 마이그레이션 이전에 저장된 기존 북마크 행은 이 컬럼들이 전부 NULL로 남는다 — 백필 없음.
ALTER TABLE bookmarks
  ADD COLUMN repo_url            TEXT,
  ADD COLUMN language             TEXT,
  ADD COLUMN stargazer_count      INT,
  ADD COLUMN labels               TEXT[],
  ADD COLUMN comment_count        INT,
  ADD COLUMN issue_body           TEXT,
  ADD COLUMN issue_created_at     TIMESTAMPTZ,
  ADD COLUMN issue_updated_at     TIMESTAMPTZ,
  ADD COLUMN score                INT,
  ADD COLUMN difficulty_level     TEXT,
  ADD COLUMN competition_level    TEXT,
  ADD COLUMN has_pr               BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN repo_activity_level  TEXT;
