import { NotFoundError, ValidationError } from "@/backend/common/errors";
import type { CreateRsvpInput, RsvpRecord } from "@/backend/rsvp/rsvp";
import { getLiveEventById } from "@/backend/live-events/repository";
import { upsertRsvp } from "@/backend/rsvp/repository";
import { createAuditLog } from "@/backend/audit/repository";
import { queueRsvpConfirmation } from "@/backend/notifications/service";

export async function createRsvpService(input: CreateRsvpInput): Promise<RsvpRecord> {
  const event = await getLiveEventById(input.eventId);
  if (!event) throw new NotFoundError("Live event not found.");
  if (event.visibility !== "published") {
    throw new ValidationError("RSVP is only allowed for published live events.");
  }

  const rsvp = await upsertRsvp(input);

  await createAuditLog({
    entityType: "rsvp",
    entityId: rsvp.id,
    action: "registered",
    afterData: {
      eventId: rsvp.eventId,
      email: rsvp.email,
      status: rsvp.status,
    },
  });

  await queueRsvpConfirmation(rsvp);

  return rsvp;
}
