import { NextResponse } from "next/server";
import { listPublicLiveEvents } from "@/backend/live-events/service";
import { errorJson } from "@/backend/common/http";
import { LIVE_EVENT_STATUSES, type LiveEventStatus } from "@/backend/live-events/liveEvent";

export const runtime = "nodejs";

function parseStatus(raw: string | null): LiveEventStatus | undefined {
  if (!raw) return undefined;
  const value = raw.trim() as LiveEventStatus;
  if (!LIVE_EVENT_STATUSES.includes(value)) return undefined;
  return value;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = parseStatus(url.searchParams.get("status"));
    const events = await listPublicLiveEvents(status);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return errorJson(error);
  }
}
