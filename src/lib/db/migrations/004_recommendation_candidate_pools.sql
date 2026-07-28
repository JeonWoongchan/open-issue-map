CREATE TABLE recommendation_candidate_pools (
  language    TEXT        NOT NULL,
  condition   TEXT        NOT NULL,
  payload     JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (language, condition)
);
