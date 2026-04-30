export const RSVP_STATUSES = ["registered", "canceled", "attended", "replay_notified"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export type RsvpRecord = {
  id: string;
  eventId: string;
  email: string;
  fullName: string | null;
  locale: string | null;
  source: string | null;
  consentMarketing: boolean;
  consentVersion: string | null;
  status: RsvpStatus;
  registeredAt: string;
  canceledAt: string | null;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRsvpInput = {
  eventId: string;
  email: string;
  fullName?: string;
  locale?: string;
  source?: string;
  consentMarketing?: boolean;
  consentVersion?: string;
};
