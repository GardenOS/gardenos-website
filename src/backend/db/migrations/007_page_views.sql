CREATE TABLE IF NOT EXISTS public.page_views (
  id          BIGSERIAL PRIMARY KEY,
  path        TEXT        NOT NULL,
  locale      TEXT,
  referrer    TEXT,
  visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_path       ON public.page_views (path);
CREATE INDEX IF NOT EXISTS idx_page_views_visited_at ON public.page_views (visited_at);
