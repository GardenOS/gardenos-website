import { NotFoundError, ValidationError } from "@/backend/common/errors";
import {
  createLiveEvent,
  findLatestPublishedReplay,
  findPublishedByStatus,
  getLiveEventById,
  listLiveEvents,
  updateLiveEventLinks,
  updateLiveEventStatus,
} from "@/backend/live-events/repository";
import type {
  CreateLiveEventInput,
  LiveEvent,
  LiveEventStatus,
  UpdateLiveEventLinksInput,
} from "@/backend/live-events/liveEvent";
import { createAuditLog } from "@/backend/audit/repository";
import { listRsvpsByEvent } from "@/backend/rsvp/repository";

export type CurrentLiveContext = {
  stage: "prelive" | "live" | "replay" | "none";
  event: LiveEvent | null;
};

export async function getCurrentLiveContext(): Promise<CurrentLiveContext> {
  const live = await findPublishedByStatus("live");
  if (live) return { stage: "live", event: live };

  const prelive = await findPublishedByStatus("prelive");
  if (prelive) return { stage: "prelive", event: prelive };

  const replay = await findLatestPublishedReplay();
  if (replay) return { stage: "replay", event: replay };

  return { stage: "none", event: null };
}

export async function listPublicLiveEvents(status?: LiveEventStatus): Promise<LiveEvent[]> {
  return listLiveEvents({
    status,
    visibility: "published",
    limit: 50,
    offset: 0,
  });
}

export async function createLiveEventService(input: CreateLiveEventInput, actorUserId: string): Promise<LiveEvent> {
  const created = await createLiveEvent(input, actorUserId);
  await createAuditLog({
    entityType: "live_event",
    entityId: created.id,
    action: "created",
    actorUserId,
    afterData: created,
  });

  return created;
}

export async function updateLiveEventStatusService(
  eventId: string,
  status: LiveEventStatus,
  actorUserId: string
): Promise<LiveEvent> {
  const existing = await getLiveEventById(eventId);
  if (!existing) throw new NotFoundError("Live event not found.");

  if (existing.status === status) {
    throw new ValidationError("Live event already in target status.");
  }

  const updated = await updateLiveEventStatus(eventId, status, actorUserId);
  if (!updated) throw new NotFoundError("Live event not found.");

  await createAuditLog({
    entityType: "live_event",
    entityId: updated.id,
    action: "status_changed",
    actorUserId,
    beforeData: { status: existing.status },
    afterData: { status: updated.status },
  });

  return updated;
}

export async function updateLiveEventLinksService(
  eventId: string,
  links: UpdateLiveEventLinksInput,
  actorUserId: string
): Promise<LiveEvent> {
  const existing = await getLiveEventById(eventId);
  if (!existing) throw new NotFoundError("Live event not found.");

  const updated = await updateLiveEventLinks(eventId, links, actorUserId);
  if (!updated) throw new NotFoundError("Live event not found.");

  await createAuditLog({
    entityType: "live_event",
    entityId: updated.id,
    action: "links_changed",
    actorUserId,
    beforeData: {
      warmupUrl: existing.warmupUrl,
      liveUrl: existing.liveUrl,
      replayUrl: existing.replayUrl,
    },
    afterData: {
      warmupUrl: updated.warmupUrl,
      liveUrl: updated.liveUrl,
      replayUrl: updated.replayUrl,
    },
  });

  return updated;
}

export async function listEventRsvpsService(eventId: string, query: { limit?: number; offset?: number }) {
  const existing = await getLiveEventById(eventId);
  if (!existing) throw new NotFoundError("Live event not found.");

  return listRsvpsByEvent(eventId, query);
}
