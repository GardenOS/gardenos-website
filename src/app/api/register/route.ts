import { NextResponse } from "next/server";
import { createAirtableRegistration } from "@/backend/intake/airtable";
import { insertRegisterIntake } from "@/backend/intake/repository";

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

    const airtable = await createAirtableRegistration({
      name,
      email,
      phone: phone || null,
      region,
      wechat: wechat || null,
      gardenFeatures,
      notes: notes || null,
      timestamp,
      lang,
    });

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
      airtableRecordId: airtable.recordId,
    });

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
