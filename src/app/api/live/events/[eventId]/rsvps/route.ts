import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { listEventRsvpsService } from "@/backend/live-events/service";

type Props = {
  params: Promise<{ eventId: string }>;
};

export const runtime = "nodejs";

export async function GET(request: Request, { params }: Props) {
  try {
    await requireAdminUser();
    const { eventId } = await params;

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    const rsvps = await listEventRsvpsService(eventId, { limit, offset });
    return NextResponse.json({ ok: true, rsvps });
  } catch (error) {
    return errorJson(error);
  }
}
