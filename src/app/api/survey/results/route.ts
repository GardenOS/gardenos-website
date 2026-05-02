import { NextResponse } from "next/server";
import { answerToSurveySlot, type SurveySlotId } from "../surveySlots";
import { listSurveyAnswerCounts } from "@/backend/intake/repository";

export const runtime = "nodejs";

const EMPTY_SLOTS: Record<SurveySlotId, number> = {
  o1: 0,
  o2: 0,
  o3: 0,
  o4: 0,
  o5: 0,
};

export async function GET() {
  const bySlot: Record<SurveySlotId, number> = { ...EMPTY_SLOTS };
  let total = 0;

  try {
    const counts = await listSurveyAnswerCounts();
    for (const item of counts) {
      const slot = answerToSurveySlot(item.answer);
      if (!slot) continue;
      bySlot[slot] += item.count;
      total += item.count;
    }

    return NextResponse.json({ ok: true, total, bySlot });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
