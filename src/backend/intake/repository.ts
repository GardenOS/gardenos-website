import { getDbPool } from "@/backend/db/client";
import { ensureRegistrationsSchema } from "@/backend/db/ensureRegistrationsSchema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RegisterIntakeInput = {
  name: string;
  email: string;
  phone: string | null;
  region: string;
  wechat: string | null;
  gardenFeatures: string[];
  notes: string | null;
  lang: string;
  timestamp: string;
  liveEventId?: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function trimToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

export async function insertRegisterIntake(input: RegisterIntakeInput): Promise<void> {
  await ensureRegistrationsSchema();
  const pool = getDbPool();

  const name = trimToNull(input.name);
  const email = trimToNull(input.email);
  const phone = trimToNull(input.phone);
  const region = trimToNull(input.region);
  const wechatId = trimToNull(input.wechat);
  const notes = trimToNull(input.notes);
  const lang = trimToNull(input.lang) ?? "en";
  const gardenFeatures = input.gardenFeatures.map((f) => f.trim()).filter(Boolean);
  const submittedAt = Number.isNaN(Date.parse(input.timestamp))
    ? new Date().toISOString()
    : input.timestamp;

  const liveEventId = input.liveEventId ?? null;

  // Mark any existing active registrations with the same email as voided
  await pool.query(
    `UPDATE public.registrations SET is_active = false WHERE lower(email) = lower($1) AND is_active = true`,
    [email]
  );

  await pool.query(
    `
      INSERT INTO public.registrations
        (full_name, email, phone, region, wechat_id, garden_features, notes, lang, submitted_at, live_event_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
    `,
    [name, email, phone, region, wechatId, gardenFeatures, notes, lang, submittedAt, liveEventId]
  );
}

// ---------------------------------------------------------------------------
// Clerk user webhook intake
// ---------------------------------------------------------------------------

export async function insertClerkUserIntake(input: {
  email: string;
  fullName: string | null;
  clerkUserId: string;
}): Promise<void> {
  const pool = getDbPool();

  await pool.query(
    `
      INSERT INTO public.clerk_users (clerk_user_id, full_name, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (clerk_user_id) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            email     = EXCLUDED.email
    `,
    [input.clerkUserId, input.fullName, input.email]
  );
}

// ---------------------------------------------------------------------------
// Survey responses
// ---------------------------------------------------------------------------

export async function insertSurveyResponse(answer: string, lang: "zh" | "en"): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `INSERT INTO public.survey_responses (answer, lang, submitted_at) VALUES ($1, $2, NOW())`,
    [answer, lang]
  );
}

export async function listSurveyAnswerCounts(): Promise<Array<{ answer: string; count: number }>> {  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT answer, COUNT(*)::int AS count
      FROM public.survey_responses
      GROUP BY answer
    `
  );
  return result.rows.map((row) => ({
    answer: String(row.answer),
    count: Number(row.count),
  }));
}

// ---------------------------------------------------------------------------
// Registrations list (for admin dashboard)
// ---------------------------------------------------------------------------

export type RegistrationRow = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  region: string;
  wechatId: string | null;
  gardenFeatures: string[];
  notes: string | null;
  lang: string;
  submittedAt: string;
  liveEventId: string | null;
  isActive: boolean;
};

function mapRegistrationRow(row: Record<string, unknown>): RegistrationRow {
  return {
    id: Number(row.id),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: row.phone ? String(row.phone) : null,
    region: String(row.region ?? ""),
    wechatId: row.wechat_id ? String(row.wechat_id) : null,
    gardenFeatures: Array.isArray(row.garden_features) ? (row.garden_features as string[]) : [],
    notes: row.notes ? String(row.notes) : null,
    lang: String(row.lang ?? ""),
    submittedAt: new Date(String(row.submitted_at)).toISOString(),
    liveEventId: row.live_event_id ? String(row.live_event_id) : null,
    isActive: row.is_active !== false,
  };
}

export async function listRegistrations(options?: {
  liveEventId?: string;
  limit?: number;
  offset?: number;
}): Promise<RegistrationRow[]> {
  await ensureRegistrationsSchema();
  const pool = getDbPool();
  const limit = options?.limit ?? 500;
  const offset = options?.offset ?? 0;
  const liveEventId = options?.liveEventId?.trim();

  const result = liveEventId
    ? await pool.query(
      `SELECT id, full_name, email, phone, region, wechat_id,
        garden_features, notes, lang, submitted_at, live_event_id, is_active
         FROM public.registrations
         WHERE live_event_id = $1
       ORDER BY is_active DESC, submitted_at DESC
         LIMIT $2 OFFSET $3`,
        [liveEventId, limit, offset]
      )
    : await pool.query(
      `SELECT id, full_name, email, phone, region, wechat_id,
        garden_features, notes, lang, submitted_at, live_event_id, is_active
         FROM public.registrations
       ORDER BY is_active DESC, submitted_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

  return result.rows.map((row) => mapRegistrationRow(row as Record<string, unknown>));
}

export async function countRegistrations(liveEventId?: string): Promise<number> {
  await ensureRegistrationsSchema();
  const pool = getDbPool();
  const normalizedLiveEventId = liveEventId?.trim();

  const result = normalizedLiveEventId
    ? await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM public.registrations
         WHERE live_event_id = $1`,
        [normalizedLiveEventId]
      )
    : await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM public.registrations`
      );

  return Number(result.rows[0]?.count ?? 0);
}

export async function deleteRegistrationById(id: number): Promise<RegistrationRow | null> {
  await ensureRegistrationsSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, full_name, email, phone, region, wechat_id,
            garden_features, notes, lang, submitted_at, live_event_id
     FROM public.registrations
     WHERE id = $1`,
    [id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const existing = mapRegistrationRow(result.rows[0] as Record<string, unknown>);

  await pool.query(`DELETE FROM public.registrations WHERE id = $1`, [id]);
  return existing;
}
