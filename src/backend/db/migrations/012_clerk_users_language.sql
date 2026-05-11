ALTER TABLE IF EXISTS public.clerk_users
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

UPDATE public.clerk_users
SET language = 'en'
WHERE language IS NULL OR language NOT IN ('zh', 'en');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clerk_users_language_check'
      AND conrelid = 'public.clerk_users'::regclass
  ) THEN
    ALTER TABLE public.clerk_users
      ADD CONSTRAINT clerk_users_language_check
      CHECK (language IN ('zh', 'en'));
  END IF;
END
$$;
