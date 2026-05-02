import { getDbPool } from "@/backend/db/client";

export type RegisterIntakeInput = {
  fullName: string | null;
  email: string;
  organization: string | null;
  scenarioNeeds: string | null;
  registerLocale: string | null;
  optionalContact: string | null;
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

  const locale = trimToNull(input.registerLocale);
  const optionalContact = trimToNull(input.optionalContact);
  const phone = locale === "en" ? optionalContact : null;
  const wechatId = locale === "zh" ? optionalContact : null;

  const rawFields: Record<string, string> = {
    Email: input.email,
  };

  const fullName = trimToNull(input.fullName);
  if (fullName) rawFields["Full Name"] = fullName;
  const organization = trimToNull(input.organization);
  if (organization) rawFields.Organization = organization;
  const scenarioNeeds = trimToNull(input.scenarioNeeds);
  if (scenarioNeeds) rawFields["Scenario & Needs"] = scenarioNeeds;
  if (phone) rawFields.Phone = phone;
  if (wechatId) rawFields["WeChat ID"] = wechatId;

  await pool.query(
    `
      INSERT INTO public.airtable_customers (
        airtable_created_time,
        full_name,
        email,
        scenario_needs,
        language,
        phone,
        wechat_id,
        organization,
        register_locale,
        intake_source,
        raw_fields
      )
      VALUES (
        NOW(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'register-form',
        $9::jsonb
      )
    `,
    [
      fullName,
      input.email,
      scenarioNeeds,
      locale === "zh" ? "Chinese" : locale === "en" ? "English" : null,
      phone,
      wechatId,
      organization,
      locale,
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
