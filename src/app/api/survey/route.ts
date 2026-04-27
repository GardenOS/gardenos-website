import { NextResponse } from "next/server";

const ZH_ANSWERS = new Set([
  "自己剪，但很累",
  "$50 以下",
  "$50–100",
  "$100–200",
  "$200 以上",
]);

const EN_ANSWERS = new Set([
  "I mow myself — but it's exhausting",
  "Under $50",
  "$50–100",
  "$100–200",
  "Over $200",
]);

type AirtableCreatePayload = {
  records: Array<{ fields: Record<string, unknown> }>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { answer?: string; lang?: string } | null;
    const answer = String(body?.answer ?? "").trim();
    const lang = String(body?.lang ?? "").trim();

    if (lang !== "zh" && lang !== "en") {
      return NextResponse.json({ ok: false, error: "Invalid lang." }, { status: 400 });
    }

    const allowed = lang === "zh" ? ZH_ANSWERS : EN_ANSWERS;
    if (!answer || !allowed.has(answer)) {
      return NextResponse.json({ ok: false, error: "Invalid answer." }, { status: 400 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_SURVEY_TABLE ?? "Survey";

    if (!apiKey || !baseId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Server is missing AIRTABLE_API_KEY / AIRTABLE_BASE_ID environment variables.",
        },
        { status: 500 }
      );
    }

    const payload: AirtableCreatePayload = {
      records: [
        {
          fields: {
            answer,
            timestamp: new Date().toISOString(),
            lang,
          },
        },
      ],
    };

    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("POST /api/survey: Airtable error", res.status, text);
      return NextResponse.json(
        { ok: false, error: "Airtable request failed.", status: res.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
