import { NextResponse } from "next/server";
import { insertRegisterIntake } from "@/backend/intake/repository";
import { findCurrentRegistrableEventId, getLiveEventById } from "@/backend/live-events/repository";
import { queueRegisterConfirmation } from "@/backend/notifications/service";

export const runtime = "nodejs";

function normalizeGardenFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let payload: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      payload = ((await request.json().catch(() => ({}))) as Record<string, unknown>) ?? {};
    } else {
      const formData = await request.formData();
      payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        region: formData.get("region"),
        wechat: formData.get("wechat"),
        notes: formData.get("notes"),
        lang: formData.get("lang"),
        timestamp: formData.get("timestamp"),
        gardenFeatures: formData.getAll("gardenFeatures"),
      };
    }

    const name = String(payload.name ?? "").trim();
    const email = String(payload.email ?? "").trim();
    const phone = String(payload.phone ?? "").trim();
    const region = String(payload.region ?? "").trim();
    const wechat = String(payload.wechat ?? "").trim();
    const notes = String(payload.notes ?? "").trim();
    const lang = String(payload.lang ?? "").trim() || "en";
    const timestamp = String(payload.timestamp ?? new Date().toISOString()).trim() || new Date().toISOString();
    const gardenFeatures = normalizeGardenFeatures(payload.gardenFeatures);

    if (!name || !email || !region) {
      return NextResponse.json({ ok: false, error: "Name, email, and region are required." }, { status: 400 });
    }

    // Auto-link to the current registrable live event (best-effort, non-blocking)
    const liveEventId = await findCurrentRegistrableEventId().catch(() => null);
    const liveEvent = liveEventId ? await getLiveEventById(liveEventId).catch(() => null) : null;

    await insertRegisterIntake({
      name,
      email,
      phone: phone || null,
      region,
      wechat: wechat || null,
      gardenFeatures,
      notes: notes || null,
      lang,
      timestamp,
      liveEventId,
    });

    const notifyResult = await queueRegisterConfirmation({
      email,
      fullName: name,
    }, liveEvent);
    if (!notifyResult.queued) {
      console.warn("[register] Confirmation email not queued", {
        email,
        reason: notifyResult.reason,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error while submitting registration.",
      },
      { status: 500 }
    );
  }
}
