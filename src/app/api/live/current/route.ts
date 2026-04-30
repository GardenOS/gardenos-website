import { NextResponse } from "next/server";
import { getCurrentLiveContext } from "@/backend/live-events/service";
import { errorJson } from "@/backend/common/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const current = await getCurrentLiveContext();
    return NextResponse.json({ ok: true, ...current });
  } catch (error) {
    return errorJson(error);
  }
}
