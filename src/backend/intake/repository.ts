import { getDbPool } from "@/backend/db/client";

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
  airtableRecordId: string | null;
};

let ensureTablesPromise: Promise<void> | null = null;

async function ensureIntakeTables() {
  const pool = getDbPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.airtable_customers (
      id bigserial PRIMARY KEY,
      airtable_record_id text UNIQUE,
      airtable_created_time timestamptz,
      full_name text,
      email text,
      lead_source text,
      notes text,
      scenario_needs text,
      language text,
      clerk_user_id text,
      phone text,
      wechat_id text,
      contact text,
      region text,
      garden_features text,
      lang text,
      submitted_at timestamptz,
      organization text,
      register_locale text,
      intake_source text,
      raw_fields jsonb,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS organization text;`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS register_locale text;`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS intake_source text;`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS contact text;`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS region text;`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS garden_features text;`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS lang text;`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS submitted_at timestamptz;`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE public.airtable_customers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW();`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.survey_responses (
      id bigserial PRIMARY KEY,
      answer text NOT NULL,
      lang text NOT NULL CHECK (lang IN ('zh', 'en')),
      submitted_at timestamptz NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_airtable_customers_email ON public.airtable_customers (lower(email));`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_airtable_customers_clerk_user_id ON public.airtable_customers (clerk_user_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_survey_responses_lang_answer ON public.survey_responses (lang, answer);`);
}

async function ensureReady() {
  if (!ensureTablesPromise) {
    ensureTablesPromise = ensureIntakeTables();
  }
  await ensureTablesPromise;
}

function trimToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export async function insertRegisterIntake(input: RegisterIntakeInput): Promise<void> {
  await ensureReady();
  const pool = getDbPool();

  const lang = trimToNull(input.lang);
  const name = trimToNull(input.name);
  const email = trimToNull(input.email);
  const phone = trimToNull(input.phone);
  const region = trimToNull(input.region);
  const wechatId = trimToNull(input.wechat);
  const notes = trimToNull(input.notes);
  const gardenFeatures = input.gardenFeatures.map((item) => item.trim()).filter(Boolean);
  const submittedAt = Number.isNaN(Date.parse(input.timestamp)) ? new Date().toISOString() : input.timestamp;

  const rawFields: Record<string, string> = {
    name: input.name,
    email: input.email,
    region: input.region,
    timestamp: submittedAt,
    lang: input.lang,
  };

  if (phone) rawFields.phone = phone;

  if (wechatId) rawFields.wechat = wechatId;
  if (gardenFeatures.length) rawFields.garden_features = gardenFeatures.join(", ");
  if (notes) rawFields.notes = notes;

  await pool.query(
    `
      INSERT INTO public.airtable_customers (
        airtable_record_id,
        airtable_created_time,
        full_name,
        email,
        notes,
        scenario_needs,
        language,
        phone,
        wechat_id,
        contact,
        region,
        garden_features,
        lang,
        submitted_at,
        organization,
        register_locale,
        intake_source,
        raw_fields
      )
      VALUES (
        $1,
        NOW(),
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'register-form',
        $10,
        $11,
        $12,
        $13,
        $14,
        NULL,
        $15,
        'register-form-v2',
        $16::jsonb
      )
    `,
    [
      input.airtableRecordId,
      name,
      email,
      notes,
      gardenFeatures.join(", "),
      lang === "zh" ? "Chinese" : lang === "en" ? "English" : null,
      phone,
      wechatId,
      contact,
      region,
      gardenFeatures.join(", "),
      lang,
      submittedAt,
      lang,
      JSON.stringify(rawFields),
    ]
  );
}

export async function insertSurveyResponse(answer: string, lang: "zh" | "en"): Promise<void> {
  await ensureReady();
  const pool = getDbPool();
  await pool.query(
    `INSERT INTO public.survey_responses (answer, lang, submitted_at) VALUES ($1, $2, NOW())`,
    [answer, lang]
  );
}

export async function listSurveyAnswerCounts(): Promise<Array<{ answer: string; count: number }>> {
  await ensureReady();
  const pool = getDbPool();
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

export async function insertClerkUserIntake(input: {
  email: string;
  fullName: string | null;
  clerkUserId: string;
}): Promise<void> {
  await ensureReady();
  const pool = getDbPool();

  const rawFields: Record<string, string> = {
    Email: input.email,
    "Clerk User ID": input.clerkUserId,
  };
  if (input.fullName) {
    rawFields["Full Name"] = input.fullName;
  }

  await pool.query(
    `
      INSERT INTO public.airtable_customers (
        airtable_created_time,
        full_name,
        email,
        clerk_user_id,
        intake_source,
        raw_fields
      )
      VALUES (NOW(), $1, $2, $3, 'clerk-webhook', $4::jsonb)
    `,
    [input.fullName, input.email, input.clerkUserId, JSON.stringify(rawFields)]
  );
}
