import { ValidationError } from "@/backend/common/errors";
import type { CreateRsvpInput } from "@/backend/rsvp/rsvp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateRsvpInput(body: unknown): CreateRsvpInput {
  const payload = (body ?? {}) as Record<string, unknown>;

  const eventId = String(payload.eventId ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();

  if (!eventId) throw new ValidationError("eventId is required.");
  if (!email) throw new ValidationError("email is required.");
  if (!EMAIL_REGEX.test(email)) throw new ValidationError("email is invalid.");

  return {
    eventId,
    email,
    fullName: String(payload.fullName ?? "").trim() || undefined,
    locale: String(payload.locale ?? "").trim() || undefined,
    source: String(payload.source ?? "").trim() || undefined,
    consentMarketing: Boolean(payload.consentMarketing),
    consentVersion: String(payload.consentVersion ?? "").trim() || undefined,
  };
}
