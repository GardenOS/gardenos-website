import { createHmac, timingSafeEqual } from "node:crypto";

type InviteTokenPayload = {
  email: string;
  eventId: string;
  exp: number;
  lang?: 'zh' | 'en';
};

type CreateInviteTokenInput = {
  email: string;
  eventId: string;
  expiresInSeconds?: number;
  lang?: 'zh' | 'en';
};

function getInviteSecret(): string {
  const secret =
    process.env.RSVP_INVITE_SECRET?.trim() ||
    process.env.RESEND_API_KEY?.trim() ||
    "";

  if (!secret) {
    throw new Error("RSVP_INVITE_SECRET (or RESEND_API_KEY) is required for RSVP invite tokens.");
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payloadBase64: string): string {
  return createHmac("sha256", getInviteSecret()).update(payloadBase64).digest("base64url");
}

export function createRsvpInviteToken(input: CreateInviteTokenInput): string {
  const payload: InviteTokenPayload = {
    email: String(input.email ?? "").trim().toLowerCase(),
    eventId: String(input.eventId ?? "").trim(),
    exp: Math.floor(Date.now() / 1000) + (input.expiresInSeconds ?? 7 * 24 * 60 * 60),
    lang: input.lang,
  };

  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyRsvpInviteToken(token: string): { email: string; eventId: string; lang?: "zh" | "en" } | null {
  const [payloadBase64, signature] = String(token ?? "").split(".");
  if (!payloadBase64 || !signature) return null;

  const expected = sign(payloadBase64);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  let payload: InviteTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as InviteTokenPayload;
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  if (!payload.email || !payload.eventId || !payload.exp) return null;
  if (Math.floor(Date.now() / 1000) > payload.exp) return null;

  return {
    email: String(payload.email).trim().toLowerCase(),
    eventId: String(payload.eventId).trim(),
    lang: payload.lang,
  };
}
