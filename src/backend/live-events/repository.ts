import { getDbPool } from "@/backend/db/client";
import { normalizePage, type PaginationQuery } from "@/backend/db/types";
import type {
  CreateLiveEventInput,
  LiveEvent,
  LiveEventStatus,
  LiveEventVisibility,
  UpdateLiveEventInput,
  UpdateLiveEventLinksInput,
} from "@/backend/live-events/liveEvent";

function mapRow(row: Record<string, unknown>): LiveEvent {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    status: String(row.status) as LiveEventStatus,
    visibility: String(row.visibility) as LiveEventVisibility,
    locale: String(row.locale ?? "en"),
    promoVideoUrl: row.promo_video_url ? String(row.promo_video_url) : null,
    posterUrl: row.poster_url ? String(row.poster_url) : null,
    warmupUrl: row.warmup_url ? String(row.warmup_url) : null,
    liveUrl: row.live_url ? String(row.live_url) : null,
    replayUrl: row.replay_url ? String(row.replay_url) : null,
    scheduledStartAt: row.scheduled_start_at ? new Date(String(row.scheduled_start_at)).toISOString() : null,
    actualStartAt: row.actual_start_at ? new Date(String(row.actual_start_at)).toISOString() : null,
    actualEndAt: row.actual_end_at ? new Date(String(row.actual_end_at)).toISOString() : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function createLiveEvent(input: CreateLiveEventInput, actorUserId: string): Promise<LiveEvent> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO live_events (
        slug, title, description, locale, visibility, status,
        promo_video_url, poster_url,
        warmup_url, live_url, replay_url, scheduled_start_at,
        created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `,
    [
      input.slug,
      input.title,
      input.description ?? null,
      input.locale ?? "en",
      input.visibility ?? "draft",
      input.status ?? "prelive",
      input.promoVideoUrl ?? null,
      input.posterUrl ?? null,
      input.warmupUrl ?? null,
      input.liveUrl ?? null,
      input.replayUrl ?? null,
      input.scheduledStartAt ?? null,
      actorUserId,
      actorUserId,
    ]
  );

  return mapRow(result.rows[0] as Record<string, unknown>);
}

export async function getLiveEventById(id: string): Promise<LiveEvent | null> {
  const pool = getDbPool();
  const result = await pool.query(`SELECT * FROM live_events WHERE id = $1 LIMIT 1`, [id]);
  if (!result.rowCount) return null;
  return mapRow(result.rows[0] as Record<string, unknown>);
}

export async function listLiveEvents(
  filters: { status?: LiveEventStatus; visibility?: LiveEventVisibility } & PaginationQuery
): Promise<LiveEvent[]> {
  const pool = getDbPool();
  const page = normalizePage(filters);

  const values: unknown[] = [];
  const where: string[] = [];

  if (filters.status) {
    values.push(filters.status);
    where.push(`status = $${values.length}`);
  }
  if (filters.visibility) {
    values.push(filters.visibility);
    where.push(`visibility = $${values.length}`);
  }

  values.push(page.limit, page.offset);

  const query = `
    SELECT *
    FROM live_events
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY scheduled_start_at ASC NULLS LAST, created_at DESC
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const result = await pool.query(query, values);
  return result.rows.map((row) => mapRow(row as Record<string, unknown>));
}

export async function findPublishedByStatus(status: LiveEventStatus): Promise<LiveEvent | null> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT *
      FROM live_events
      WHERE visibility = 'published' AND status = $1
      ORDER BY scheduled_start_at ASC NULLS LAST, updated_at DESC
      LIMIT 1
    `,
    [status]
  );

  if (!result.rowCount) return null;
  return mapRow(result.rows[0] as Record<string, unknown>);
}

export async function findLatestPublishedReplay(): Promise<LiveEvent | null> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT *
      FROM live_events
      WHERE visibility = 'published' AND status = 'replay'
      ORDER BY COALESCE(actual_end_at, updated_at) DESC
      LIMIT 1
    `
  );

  if (!result.rowCount) return null;
  return mapRow(result.rows[0] as Record<string, unknown>);
}

export async function updateLiveEventStatus(
  eventId: string,
  status: LiveEventStatus,
  actorUserId: string
): Promise<LiveEvent | null> {
  const pool = getDbPool();

  const setActualStart = status === "live" ? `, actual_start_at = COALESCE(actual_start_at, NOW())` : "";
  const setActualEnd = status === "replay" ? `, actual_end_at = COALESCE(actual_end_at, NOW())` : "";

  const result = await pool.query(
    `
      UPDATE live_events
      SET status = $2,
          updated_by = $3,
          updated_at = NOW()
          ${setActualStart}
          ${setActualEnd}
      WHERE id = $1
      RETURNING *
    `,
    [eventId, status, actorUserId]
  );

  if (!result.rowCount) return null;
  return mapRow(result.rows[0] as Record<string, unknown>);
}

export async function updateLiveEventLinks(
  eventId: string,
  links: UpdateLiveEventLinksInput,
  actorUserId: string
): Promise<LiveEvent | null> {
  const pool = getDbPool();

  const sets: string[] = [];
  const values: unknown[] = [eventId];

  if (Object.prototype.hasOwnProperty.call(links, "promoVideoUrl")) {
    values.push(links.promoVideoUrl ?? null);
    sets.push(`promo_video_url = $${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(links, "posterUrl")) {
    values.push(links.posterUrl ?? null);
    sets.push(`poster_url = $${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(links, "warmupUrl")) {
    values.push(links.warmupUrl ?? null);
    sets.push(`warmup_url = $${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(links, "liveUrl")) {
    values.push(links.liveUrl ?? null);
    sets.push(`live_url = $${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(links, "replayUrl")) {
    values.push(links.replayUrl ?? null);
    sets.push(`replay_url = $${values.length}`);
  }

  values.push(actorUserId);
  sets.push(`updated_by = $${values.length}`);
  sets.push(`updated_at = NOW()`);

  const query = `
    UPDATE live_events
    SET ${sets.join(", ")}
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, values);
  if (!result.rowCount) return null;
  return mapRow(result.rows[0] as Record<string, unknown>);
}

export async function updateLiveEvent(
  eventId: string,
  input: UpdateLiveEventInput,
  actorUserId: string
): Promise<LiveEvent | null> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE live_events
      SET slug = $2,
          title = $3,
          visibility = $4,
          status = $5,
          promo_video_url = $6,
          poster_url = $7,
          warmup_url = $8,
          live_url = $9,
          replay_url = $10,
          scheduled_start_at = $11,
          updated_by = $12,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      eventId,
      input.slug,
      input.title,
      input.visibility,
      input.status,
      input.promoVideoUrl,
      input.posterUrl,
      input.warmupUrl,
      input.liveUrl,
      input.replayUrl,
      input.scheduledStartAt,
      actorUserId,
    ]
  );

  if (!result.rowCount) return null;
  return mapRow(result.rows[0] as Record<string, unknown>);
}

/**
 * Returns the UUID of the most relevant published live event for linking to a registration.
 * Priority: prelive → live → most recent published event.
 * Returns null if no published event exists.
 */
export async function findCurrentRegistrableEventId(): Promise<string | null> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT id FROM live_events
      WHERE visibility = 'published'
      ORDER BY
        CASE status WHEN 'prelive' THEN 0 WHEN 'live' THEN 1 ELSE 2 END,
        COALESCE(scheduled_start_at, created_at) ASC
      LIMIT 1
    `
  );
  if (!result.rowCount) return null;
  return String((result.rows[0] as Record<string, unknown>).id);
}

export async function deleteLiveEvent(eventId: string): Promise<LiveEvent | null> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      DELETE FROM live_events
      WHERE id = $1
      RETURNING *
    `,
    [eventId]
  );

  if (!result.rowCount) return null;
  return mapRow(result.rows[0] as Record<string, unknown>);
}
