import { NextResponse } from "next/server";
import { errorJson } from "@/backend/common/http";
import { validateCreateRsvpInput } from "@/backend/rsvp/validators";
import { createRsvpService } from "@/backend/rsvp/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = validateCreateRsvpInput(body);
    const rsvp = await createRsvpService(input);
    return NextResponse.json({ ok: true, rsvp });
  } catch (error) {
    return errorJson(error);
  }
}
