import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { listRegistrations } from "@/backend/intake/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);
    const liveEventId = url.searchParams.get("liveEventId") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "500");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    const registrations = await listRegistrations({
      liveEventId,
      limit,
      offset,
    });
    return NextResponse.json({ ok: true, registrations });
  } catch (error) {
    return errorJson(error);
  }
}
