import {
  LIVE_EVENT_STATUSES,
  LIVE_EVENT_VISIBILITIES,
  type CreateLiveEventInput,
  type LiveEventStatus,
  type LiveEventVisibility,
  type UpdateLiveEventLinksInput,
} from "@/backend/live-events/liveEvent";
import { ValidationError } from "@/backend/common/errors";

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function toNullableTrimmed(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function parseStatus(value: unknown): LiveEventStatus | undefined {
  if (value == null || value === "") return undefined;
  const text = String(value).trim() as LiveEventStatus;
  if (!LIVE_EVENT_STATUSES.includes(text)) {
    throw new ValidationError("Invalid live event status.");
  }
  return text;
}

function parseVisibility(value: unknown): LiveEventVisibility | undefined {
  if (value == null || value === "") return undefined;
  const text = String(value).trim() as LiveEventVisibility;
  if (!LIVE_EVENT_VISIBILITIES.includes(text)) {
    throw new ValidationError("Invalid live event visibility.");
  }
  return text;
}

export function validateCreateLiveEventInput(body: unknown): CreateLiveEventInput {
  const payload = (body ?? {}) as Record<string, unknown>;
  const slug = String(payload.slug ?? "").trim();
  const title = String(payload.title ?? "").trim();

  if (!slug) throw new ValidationError("slug is required.");
  if (!title) throw new ValidationError("title is required.");

  const scheduledStartAt = toNullableTrimmed(payload.scheduledStartAt);
  if (scheduledStartAt && Number.isNaN(Date.parse(scheduledStartAt))) {
    throw new ValidationError("scheduledStartAt must be a valid ISO date string.");
  }

  const warmupUrl = toNullableTrimmed(payload.warmupUrl);
  const liveUrl = toNullableTrimmed(payload.liveUrl);
  const replayUrl = toNullableTrimmed(payload.replayUrl);
  for (const [field, value] of [
    ["warmupUrl", warmupUrl],
    ["liveUrl", liveUrl],
    ["replayUrl", replayUrl],
  ] as const) {
    if (value && !isValidUrl(value)) {
      throw new ValidationError(`${field} must be a valid URL.`);
    }
  }

  return {
    slug,
    title,
    description: toNullableTrimmed(payload.description) ?? undefined,
    locale: toNullableTrimmed(payload.locale) ?? undefined,
    visibility: parseVisibility(payload.visibility),
    status: parseStatus(payload.status),
    warmupUrl: warmupUrl ?? undefined,
    liveUrl: liveUrl ?? undefined,
    replayUrl: replayUrl ?? undefined,
    scheduledStartAt: scheduledStartAt ?? undefined,
  };
}

export function validateUpdateLiveLinksInput(body: unknown): UpdateLiveEventLinksInput {
  const payload = (body ?? {}) as Record<string, unknown>;

  const out: UpdateLiveEventLinksInput = {};
  for (const key of ["warmupUrl", "liveUrl", "replayUrl"] as const) {
    if (!(key in payload)) continue;
    const value = toNullableTrimmed(payload[key]);
    if (value && !isValidUrl(value)) {
      throw new ValidationError(`${key} must be a valid URL.`);
    }
    out[key] = value;
  }

  if (Object.keys(out).length === 0) {
    throw new ValidationError("At least one link field is required.");
  }

  return out;
}

export function validateStatusInput(body: unknown): LiveEventStatus {
  const payload = (body ?? {}) as Record<string, unknown>;
  const status = parseStatus(payload.status);
  if (!status) throw new ValidationError("status is required.");
  return status;
}
