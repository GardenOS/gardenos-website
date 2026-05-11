import { NotFoundError, ValidationError } from "@/backend/common/errors";
import {
  createLiveEvent,
  deleteLiveEvent,
  findLatestPublishedEnded,
  findLatestPublishedReplay,
  findPublishedByStatus,
  getLiveEventById,
  listLiveEvents,
  updateLiveEvent,
  updateLiveEventLinks,
  updateLiveEventStatus,
} from "@/backend/live-events/repository";
import type {
  CreateLiveEventInput,
  LiveEvent,
  LiveEventStatus,
  UpdateLiveEventInput,
  UpdateLiveEventLinksInput,
} from "@/backend/live-events/liveEvent";
import { createAuditLog } from "@/backend/audit/repository";
import {
  hasRegisteredRsvpForEvent,
  listInviteCandidateEmailsByEvent,
  listRsvpsByEvent,
} from "@/backend/rsvp/repository";
import { queueRsvpInvite } from "@/backend/notifications/service";
import { hasInviteBeenSent, recordInviteSend } from "@/backend/live-events/inviteRecords";

export type CurrentLiveContext = {
  stage: "prelive" | "live" | "replay" | "ended" | "none";
  event: LiveEvent | null;
};

export async function getCurrentLiveContext(): Promise<CurrentLiveContext> {
  const live = await findPublishedByStatus("live");
  if (live) return { stage: "live", event: live };

  const prelive = await findPublishedByStatus("prelive");
  if (prelive) return { stage: "prelive", event: prelive };

  const replay = await findLatestPublishedReplay();
  if (replay) return { stage: "replay", event: replay };

  const ended = await findLatestPublishedEnded();
  if (ended) return { stage: "ended", event: ended };

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

export async function listAllLiveEventsAdmin(): Promise<LiveEvent[]> {
  return listLiveEvents({ limit: 200, offset: 0 });
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

export async function updateLiveEventService(
  eventId: string,
  input: UpdateLiveEventInput,
  actorUserId: string
): Promise<LiveEvent> {
  const existing = await getLiveEventById(eventId);
  if (!existing) throw new NotFoundError("Live event not found.");

  const updated = await updateLiveEvent(eventId, input, actorUserId);
  if (!updated) throw new NotFoundError("Live event not found.");

  await createAuditLog({
    entityType: "live_event",
    entityId: updated.id,
    action: "updated",
    actorUserId,
    beforeData: existing,
    afterData: updated,
  });

  return updated;
}

export async function deleteLiveEventService(eventId: string, actorUserId: string): Promise<LiveEvent> {
  const existing = await getLiveEventById(eventId);
  if (!existing) throw new NotFoundError("Live event not found.");

  const deleted = await deleteLiveEvent(eventId);
  if (!deleted) throw new NotFoundError("Live event not found.");

  await createAuditLog({
    entityType: "live_event",
    entityId: existing.id,
    action: "deleted",
    actorUserId,
    beforeData: existing,
  });

  return deleted;
}

export async function listEventRsvpsService(eventId: string, query: { limit?: number; offset?: number }) {
  const existing = await getLiveEventById(eventId);
  if (!existing) throw new NotFoundError("Live event not found.");

  return listRsvpsByEvent(eventId, query);
}

export async function sendRsvpInviteEmailsService(eventId: string, actorUserId: string): Promise<{
  candidateCount: number;
  invitedCount: number;
  skippedCount: number;
  failedCount: number;
  sentTo: string[];
  skippedTo: string[];
  failedTo: string[];
}> {
  const event = await getLiveEventById(eventId);
  if (!event) throw new NotFoundError("Live event not found.");

  const candidateContacts = await listInviteCandidateEmailsByEvent(eventId);

  const sentTo: string[] = [];
  const skippedTo: string[] = [];
  const failedTo: string[] = [];
  for (const candidate of candidateContacts) {
    const alreadyRegistered = await hasRegisteredRsvpForEvent(eventId, candidate.email);
    if (alreadyRegistered) {
      skippedTo.push(candidate.email);
      await recordInviteSend(eventId, candidate.email, "skipped", "already_registered").catch(() => undefined);
      continue;
    }

    const alreadySent = await hasInviteBeenSent(eventId, candidate.email);
    if (alreadySent) {
      skippedTo.push(candidate.email);
      await recordInviteSend(eventId, candidate.email, "skipped", "already_invited").catch(() => undefined);
      continue;
    }

    const result = await queueRsvpInvite({
      email: candidate.email,
      lang: candidate.lang,
      event,
    });
    if (result.queued) {
      sentTo.push(candidate.email);
    } else {
      failedTo.push(candidate.email);
      await recordInviteSend(eventId, candidate.email, "failed", result.reason).catch(() => undefined);
    }
  }

  await createAuditLog({
    entityType: "live_event",
    entityId: eventId,
    action: "invite_rsvp_sent",
    actorUserId,
    afterData: {
      candidateCount: candidateContacts.length,
      invitedCount: sentTo.length,
      skippedCount: skippedTo.length,
      failedCount: failedTo.length,
      sentTo,
      skippedTo,
      failedTo,
    },
  });

  return {
    candidateCount: candidateContacts.length,
    invitedCount: sentTo.length,
    skippedCount: skippedTo.length,
    failedCount: failedTo.length,
    sentTo,
    skippedTo,
    failedTo,
  };
}
