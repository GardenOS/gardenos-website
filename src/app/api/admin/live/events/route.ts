import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { listAllLiveEventsAdmin } from "@/backend/live-events/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdminUser();
    const events = await listAllLiveEventsAdmin();
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return errorJson(error);
  }
}
