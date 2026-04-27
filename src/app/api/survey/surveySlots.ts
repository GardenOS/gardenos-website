/** Stable option ids for merged survey stats (zh + en answers map here). */
export type SurveySlotId = "o1" | "o2" | "o3" | "o4" | "o5";

/** Map Airtable `answer` text → slot; unknown strings return null. */
export function answerToSurveySlot(answer: string): SurveySlotId | null {
  const a = answer.trim();
  const map: Record<string, SurveySlotId> = {
    "自己剪，但很累": "o1",
    "I mow myself — but it's exhausting": "o1",
    "$50 以下": "o2",
    "$50以下": "o2",
    "Under $50": "o2",
    "$50–100": "o3",
    "$100–200": "o4",
    "$200 以上": "o5",
    "$200以上": "o5",
    "Over $200": "o5",
  };
  return map[a] ?? null;
}
