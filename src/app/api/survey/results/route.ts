import { NextResponse } from "next/server";
import { answerToSurveySlot, type SurveySlotId } from "../surveySlots";

type AirtableListResponse = {
  records?: Array<{ fields?: Record<string, unknown> }>;
  offset?: string;
};

const EMPTY_SLOTS: Record<SurveySlotId, number> = {
  o1: 0,
  o2: 0,
  o3: 0,
  o4: 0,
  o5: 0,
};

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_SURVEY_TABLE ?? "Survey";

  if (!apiKey || !baseId) {
    return NextResponse.json(
      { ok: false, error: "Server is missing AIRTABLE_API_KEY / AIRTABLE_BASE_ID environment variables." },
      { status: 500 }
    );
  }

  const bySlot: Record<SurveySlotId, number> = { ...EMPTY_SLOTS };
  let total = 0;
  let offset: string | undefined;

  try {
    do {
      const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("GET /api/survey/results: Airtable error", res.status, text);
        return NextResponse.json(
          { ok: false, error: "Airtable request failed.", status: res.status },
          { status: 502 }
        );
      }

      const data = (await res.json()) as AirtableListResponse;
      for (const rec of data.records ?? []) {
        const ans = String(rec.fields?.answer ?? "").trim();
        if (!ans) continue;
        const slot = answerToSurveySlot(ans);
        if (!slot) continue;
        bySlot[slot]++;
        total++;
      }
      offset = data.offset;
    } while (offset);

    return NextResponse.json({ ok: true, total, bySlot });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
