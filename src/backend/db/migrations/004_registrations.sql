-- Registration intake tables (migrated from Airtable + inline DDL)

CREATE TABLE IF NOT EXISTS public.registrations (
  id          BIGSERIAL PRIMARY KEY,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  region      TEXT NOT NULL,
  wechat_id   TEXT,
  garden_features TEXT[],
  notes       TEXT,
  lang        TEXT NOT NULL DEFAULT 'en',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registrations_email
  ON public.registrations (lower(email));

CREATE INDEX IF NOT EXISTS idx_registrations_submitted_at
  ON public.registrations (submitted_at DESC);

-- Clerk user intake (sign-up webhook records)
CREATE TABLE IF NOT EXISTS public.clerk_users (
  id            BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  email         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clerk_users_email
  ON public.clerk_users (lower(email));

-- Survey responses (previously inline-created)
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id          BIGSERIAL PRIMARY KEY,
  answer      TEXT NOT NULL,
  lang        TEXT NOT NULL CHECK (lang IN ('zh', 'en')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_lang_answer
  ON public.survey_responses (lang, answer);
