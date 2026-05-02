import { getDbPool } from "@/backend/db/client";

const DEFAULT_INTERNAL_EMAILS = [
  "houminnzwork@gmail.com",
  "kaiyu.yang@youngproperty.co.nz",
  "haohan6037@gmail.com",
] as const;

let ensurePromise: Promise<void> | null = null;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

async function ensureInternalWhitelistTable() {
  const pool = getDbPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.internal_access_whitelist (
      email text PRIMARY KEY,
      created_by text,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  for (const email of DEFAULT_INTERNAL_EMAILS) {
    await pool.query(
      `
        INSERT INTO public.internal_access_whitelist (email, created_by)
        VALUES ($1, 'seed')
        ON CONFLICT (email) DO NOTHING
      `,
      [email]
    );
  }
}

async function ensureReady() {
  if (!ensurePromise) {
    ensurePromise = ensureInternalWhitelistTable();
  }
  await ensurePromise;
}

export async function isEmailInInternalWhitelist(rawEmail: string): Promise<boolean> {
  await ensureReady();
  const pool = getDbPool();
  const email = normalizeEmail(rawEmail);
  if (!email) return false;

  const result = await pool.query(
    `SELECT 1 FROM public.internal_access_whitelist WHERE email = $1 LIMIT 1`,
    [email]
  );

  return Boolean(result.rowCount);
}

export async function listInternalWhitelistEmails(): Promise<string[]> {
  await ensureReady();
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT email FROM public.internal_access_whitelist ORDER BY email ASC`
  );

  return result.rows.map((row) => String(row.email));
}

export async function addInternalWhitelistEmail(rawEmail: string, actorUserId: string): Promise<void> {
  await ensureReady();
  const pool = getDbPool();
  const email = normalizeEmail(rawEmail);

  await pool.query(
    `
      INSERT INTO public.internal_access_whitelist (email, created_by)
      VALUES ($1, $2)
      ON CONFLICT (email)
      DO UPDATE SET updated_at = NOW()
    `,
    [email, actorUserId]
  );
}

export async function removeInternalWhitelistEmail(rawEmail: string): Promise<void> {
  await ensureReady();
  const pool = getDbPool();
  const email = normalizeEmail(rawEmail);

  await pool.query(`DELETE FROM public.internal_access_whitelist WHERE email = $1`, [email]);
}
