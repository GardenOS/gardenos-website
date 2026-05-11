export const LIVE_EVENT_STATUSES = ["prelive", "live", "replay", "ended"] as const;
export type LiveEventStatus = (typeof LIVE_EVENT_STATUSES)[number];

export const LIVE_EVENT_VISIBILITIES = ["draft", "published", "archived"] as const;
export type LiveEventVisibility = (typeof LIVE_EVENT_VISIBILITIES)[number];

export type LiveEvent = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  status: LiveEventStatus;
  visibility: LiveEventVisibility;
  locale: string;
  promoVideoUrl: string | null;
  posterUrl: string | null;
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
  titleEn: string;
  description?: string;
  descriptionEn?: string;
  locale?: string;
  visibility?: LiveEventVisibility;
  status?: LiveEventStatus;
  promoVideoUrl?: string;
  posterUrl?: string;
  warmupUrl?: string;
  liveUrl?: string;
  replayUrl?: string;
  scheduledStartAt?: string;
};

export type UpdateLiveEventLinksInput = {
  promoVideoUrl?: string | null;
  posterUrl?: string | null;
  warmupUrl?: string | null;
  liveUrl?: string | null;
  replayUrl?: string | null;
};

export type UpdateLiveEventInput = {
  slug: string;
  title: string;
  titleEn: string;
  description: string | null;
  descriptionEn: string | null;
  visibility: LiveEventVisibility;
  status: LiveEventStatus;
  promoVideoUrl: string | null;
  posterUrl: string | null;
  warmupUrl: string | null;
  liveUrl: string | null;
  replayUrl: string | null;
  scheduledStartAt: string | null;
};
