import { NextResponse } from "next/server";
import { insertSurveyResponse } from "@/backend/intake/repository";

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

export const runtime = "nodejs";

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

    await insertSurveyResponse(answer, lang);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
