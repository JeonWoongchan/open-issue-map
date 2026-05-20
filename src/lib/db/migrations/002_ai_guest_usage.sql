CREATE TABLE ai_guest_usage (
  ip          TEXT        PRIMARY KEY,
  count       INT         NOT NULL DEFAULT 1,
  expires_at  TIMESTAMPTZ NOT NULL
);
