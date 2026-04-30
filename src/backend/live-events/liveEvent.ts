export const LIVE_EVENT_STATUSES = ["prelive", "live", "replay"] as const;
export type LiveEventStatus = (typeof LIVE_EVENT_STATUSES)[number];

export const LIVE_EVENT_VISIBILITIES = ["draft", "published", "archived"] as const;
export type LiveEventVisibility = (typeof LIVE_EVENT_VISIBILITIES)[number];

export type LiveEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: LiveEventStatus;
  visibility: LiveEventVisibility;
  locale: string;
  warmupUrl: string | null;
  liveUrl: string | null;
  replayUrl: string | null;
  scheduledStartAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLiveEventInput = {
  slug: string;
  title: string;
  description?: string;
  locale?: string;
  visibility?: LiveEventVisibility;
  status?: LiveEventStatus;
  warmupUrl?: string;
  liveUrl?: string;
  replayUrl?: string;
  scheduledStartAt?: string;
};

export type UpdateLiveEventLinksInput = {
  warmupUrl?: string | null;
  liveUrl?: string | null;
  replayUrl?: string | null;
};
