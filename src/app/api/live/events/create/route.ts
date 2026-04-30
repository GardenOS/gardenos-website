import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { validateCreateLiveEventInput } from "@/backend/live-events/validators";
import { createLiveEventService } from "@/backend/live-events/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminUser();
    const body = await request.json().catch(() => ({}));
    const input = validateCreateLiveEventInput(body);
    const event = await createLiveEventService(input, userId);
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return errorJson(error);
  }
}
