import { getDbPool } from "@/backend/db/client";

export interface InviteSendRecord {
  id: string;
  eventId: string;
  email: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'skipped';
  errorMessage?: string;
  createdAt: string;
}

/**
 * Record a sent invite email for deduplication and audit purposes
 */
export async function recordInviteSend(
  eventId: string,
  email: string,
  status: 'sent' | 'failed' | 'skipped' = 'sent',
  errorMessage?: string
): Promise<void> {
  const db = getDbPool();
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    await db.query(
      `
        INSERT INTO live_invite_send_records (event_id, email, status, error_message)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (event_id, email) DO UPDATE SET
          sent_at = NOW(),
          status = $3,
          error_message = $4
      `,
      [eventId, normalizedEmail, status, errorMessage || null]
    );
  } catch (error) {
    console.error('[invite-records] Failed to record invite send:', error);
    throw error;
  }
}

/**
 * Check if an invite has already been sent to this user for this event
 */
export async function hasInviteBeenSent(eventId: string, email: string): Promise<boolean> {
  const db = getDbPool();
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const result = await db.query(
      `
        SELECT id FROM live_invite_send_records
        WHERE event_id = $1 AND email = $2 AND status = 'sent'
        LIMIT 1
      `,
      [eventId, normalizedEmail]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('[invite-records] Failed to check invite send history:', error);
    return false;
  }
}

/**
 * Get all invite records for an event
 */
export async function getInviteRecordsForEvent(eventId: string): Promise<InviteSendRecord[]> {
  const db = getDbPool();
  
  try {
    const result = await db.query(
      `
        SELECT 
          id,
          event_id as "eventId",
          email,
          sent_at as "sentAt",
          status,
          error_message as "errorMessage",
          created_at as "createdAt"
        FROM live_invite_send_records
        WHERE event_id = $1
        ORDER BY sent_at DESC
      `,
      [eventId]
    );
    return result.rows;
  } catch (error) {
    console.error('[invite-records] Failed to get invite records:', error);
    return [];
  }
}

/**
 * Get invite records for a specific email
 */
export async function getInviteRecordsForEmail(email: string): Promise<InviteSendRecord[]> {
  const db = getDbPool();
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const result = await db.query(
      `
        SELECT 
          id,
          event_id as "eventId",
          email,
          sent_at as "sentAt",
          status,
          error_message as "errorMessage",
          created_at as "createdAt"
        FROM live_invite_send_records
        WHERE email = $1
        ORDER BY sent_at DESC
      `,
      [normalizedEmail]
    );
    return result.rows;
  } catch (error) {
    console.error('[invite-records] Failed to get invite records for email:', error);
    return [];
  }
}
