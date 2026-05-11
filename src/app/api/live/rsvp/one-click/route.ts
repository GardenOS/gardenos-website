import { NextResponse } from "next/server";
import { verifyRsvpInviteToken } from "@/backend/rsvp/inviteToken";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const payload = verifyRsvpInviteToken(token);
  const lang = payload?.lang === "en" ? "en" : "zh";
  const target = new URL(`/${lang}/rsvp`, url.origin);
  if (token) {
    target.searchParams.set("token", token);
  }

  return NextResponse.redirect(target, { status: 307 });
}
