import type { RsvpRecord } from "@/backend/rsvp/rsvp";

export type NotificationDispatchResult = {
  queued: boolean;
  reason?: string;
};

export async function queueRsvpConfirmation(_rsvp: RsvpRecord): Promise<NotificationDispatchResult> {
  // Placeholder for future email/SMS integration.
  return {
    queued: false,
    reason: "notification-provider-not-configured",
  };
}
