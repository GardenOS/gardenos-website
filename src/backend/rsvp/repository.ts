import { getDbPool } from "@/backend/db/client";
import { normalizePage, type PaginationQuery } from "@/backend/db/types";
import type { CreateRsvpInput, RsvpRecord } from "@/backend/rsvp/rsvp";
import { ensureRegistrationsSchema } from "@/backend/db/ensureRegistrationsSchema";

function mapRow(row: Record<string, unknown>): RsvpRecord {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    email: String(row.email),
    fullName: row.full_name ? String(row.full_name) : null,
    locale: row.locale ? String(row.locale) : null,
    source: row.source ? String(row.source) : null,
    consentMarketing: Boolean(row.consent_marketing),
    consentVersion: row.consent_version ? String(row.consent_version) : null,
    status: String(row.status) as RsvpRecord["status"],
    registeredAt: new Date(String(row.registered_at)).toISOString(),
    canceledAt: row.canceled_at ? new Date(String(row.canceled_at)).toISOString() : null,
    lastNotifiedAt: row.last_notified_at ? new Date(String(row.last_notified_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function upsertRsvp(input: CreateRsvpInput): Promise<RsvpRecord> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO live_rsvps (
        event_id, email, full_name, locale, source,
        consent_marketing, consent_version, status, registered_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'registered', NOW())
      ON CONFLICT (event_id, email)
      DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, live_rsvps.full_name),
        locale = COALESCE(EXCLUDED.locale, live_rsvps.locale),
        source = COALESCE(EXCLUDED.source, live_rsvps.source),
        consent_marketing = EXCLUDED.consent_marketing,
        consent_version = COALESCE(EXCLUDED.consent_version, live_rsvps.consent_version),
        status = 'registered',
        canceled_at = NULL,
        registered_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `,
    [
      input.eventId,
      input.email,
      input.fullName ?? null,
      input.locale ?? null,
      input.source ?? null,
      input.consentMarketing ?? false,
      input.consentVersion ?? null,
    ]
  );

  return mapRow(result.rows[0] as Record<string, unknown>);
}

export async function listRsvpsByEvent(eventId: string, pageQuery: PaginationQuery): Promise<RsvpRecord[]> {
  const pool = getDbPool();
  const page = normalizePage(pageQuery);
  const result = await pool.query(
    `
      SELECT *
      FROM live_rsvps
      WHERE event_id = $1
      ORDER BY registered_at DESC
      LIMIT $2 OFFSET $3
    `,
    [eventId, page.limit, page.offset]
  );

  return result.rows.map((row) => mapRow(row as Record<string, unknown>));
}

export type InviteCandidate = {
  email: string;
  lang: "zh" | "en";
};

export async function listInviteCandidateEmailsByEvent(eventId: string): Promise<InviteCandidate[]> {
  await ensureRegistrationsSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      WITH candidate_contacts AS (
        SELECT LOWER(TRIM(email)) AS email,
               CASE WHEN LOWER(TRIM(lang)) = 'en' THEN 'en' ELSE 'zh' END AS lang,
               1 AS priority,
               submitted_at AS source_time
        FROM public.registrations
        WHERE email IS NOT NULL AND is_active = true
        UNION ALL
        SELECT LOWER(TRIM(email)) AS email,
               CASE WHEN LOWER(TRIM(locale)) = 'en' THEN 'en' ELSE 'zh' END AS lang,
               2 AS priority,
               registered_at AS source_time
        FROM live_rsvps
        WHERE email IS NOT NULL
      ),
      preferred_contacts AS (
        SELECT DISTINCT ON (email)
          email,
          lang
        FROM candidate_contacts
        WHERE email <> ''
        ORDER BY email, priority ASC, source_time DESC NULLS LAST
      )
      SELECT c.email, c.lang
      FROM preferred_contacts c
      WHERE c.email <> ''
      ORDER BY c.email ASC
    `,
    [eventId]
  );

  return result.rows
    .map((row) => {
      const mapped = row as Record<string, unknown>;
      const email = String(mapped.email ?? "").trim().toLowerCase();
      const lang: InviteCandidate["lang"] = String(mapped.lang ?? "zh") === "en" ? "en" : "zh";
      return { email, lang };
    })
    .filter((row) => Boolean(row.email));
}

export async function hasRegisteredRsvpForEvent(eventId: string, email: string): Promise<boolean> {
  const pool = getDbPool();
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  if (!normalizedEmail) return false;

  const result = await pool.query(
    `
      SELECT 1
      FROM live_rsvps
      WHERE event_id = $1
        AND LOWER(email) = $2
        AND status = 'registered'
      LIMIT 1
    `,
    [eventId, normalizedEmail]
  );

  return result.rows.length > 0;
}
