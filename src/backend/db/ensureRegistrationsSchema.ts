import { getDbPool } from "@/backend/db/client";

let ensurePromise: Promise<void> | null = null;

async function ensureOnce(): Promise<void> {
  const pool = getDbPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.registrations (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      region TEXT NOT NULL,
      wechat_id TEXT,
      garden_features TEXT[],
      notes TEXT,
      lang TEXT NOT NULL DEFAULT 'en',
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_registrations_email
      ON public.registrations (lower(email))
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_registrations_submitted_at
      ON public.registrations (submitted_at DESC)
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF to_regclass('public.live_events') IS NOT NULL THEN
        ALTER TABLE public.registrations
          ADD COLUMN IF NOT EXISTS live_event_id UUID REFERENCES public.live_events(id) ON DELETE SET NULL;
      ELSE
        ALTER TABLE public.registrations
          ADD COLUMN IF NOT EXISTS live_event_id UUID;
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_registrations_live_event_id
      ON public.registrations (live_event_id)
  `);

  // is_active: false = voided (superseded by a newer registration with same email)
  await pool.query(`
    ALTER TABLE public.registrations
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_registrations_is_active
      ON public.registrations (is_active)
  `);
}

export async function ensureRegistrationsSchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = ensureOnce().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}
