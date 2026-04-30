import { getDbPool } from "@/backend/db/client";
import { normalizePage, type PaginationQuery } from "@/backend/db/types";
import type { CreateRsvpInput, RsvpRecord } from "@/backend/rsvp/rsvp";

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
