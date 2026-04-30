import { getDbPool } from "@/backend/db/client";
import type { AuditLogRecord, CreateAuditLogInput } from "@/backend/audit/auditLog";

function mapRow(row: Record<string, unknown>): AuditLogRecord {
  return {
    id: Number(row.id),
    entityType: String(row.entity_type) as AuditLogRecord["entityType"],
    entityId: String(row.entity_id),
    action: String(row.action),
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    beforeData: (row.before_data as Record<string, unknown> | null) ?? null,
    afterData: (row.after_data as Record<string, unknown> | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogRecord> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO live_event_audit_logs (entity_type, entity_id, action, actor_user_id, before_data, after_data)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
      RETURNING *
    `,
    [
      input.entityType,
      input.entityId,
      input.action,
      input.actorUserId ?? null,
      input.beforeData ? JSON.stringify(input.beforeData) : null,
      input.afterData ? JSON.stringify(input.afterData) : null,
    ]
  );

  return mapRow(result.rows[0] as Record<string, unknown>);
}
