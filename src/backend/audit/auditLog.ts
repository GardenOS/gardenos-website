export type AuditEntityType = "live_event" | "rsvp";

export type AuditLogRecord = {
  id: number;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actorUserId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  createdAt: string;
};

export type CreateAuditLogInput = {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actorUserId?: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
};
