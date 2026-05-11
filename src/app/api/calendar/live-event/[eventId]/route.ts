import { NextResponse } from "next/server";
import { getLiveEventById } from "@/backend/live-events/repository";

export const runtime = "nodejs";

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toIcsDateTime(value: Date): string {
  return value.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:9090";
  }

  return "https://mygardenos.com";
}

function normalizeLang(value: string | null): "zh" | "en" {
  return value === "en" ? "en" : "zh";
}

function pickEventTitle(event: { title: string; titleEn: string | null }, lang: "zh" | "en"): string {
  if (lang === "en") {
    return event.titleEn?.trim() || event.title;
  }
  return event.title;
}

export async function GET(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const url = new URL(request.url);
  const lang = normalizeLang(url.searchParams.get("lang"));
  const { eventId } = await context.params;
  const event = await getLiveEventById(eventId);

  if (!event?.scheduledStartAt) {
    return NextResponse.json({ ok: false, error: "Live event not found." }, { status: 404 });
  }

  const startAt = new Date(event.scheduledStartAt);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ ok: false, error: "Live event time is invalid." }, { status: 400 });
  }

  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  const siteUrl = getSiteUrl();
  const details = event.description?.trim() || (lang === "en" ? "GardenOS event registration confirmation" : "GardenOS 活动预约确认");
  const title = pickEventTitle(event, lang);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GardenOS//Live Event//CN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:live-event-${event.id}@mygardenos.com`,
    `DTSTAMP:${toIcsDateTime(new Date())}`,
    `DTSTART:${toIcsDateTime(startAt)}`,
    `DTEND:${toIcsDateTime(endAt)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    `LOCATION:${escapeIcsText(siteUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="gardenos-live-event-${event.id}.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}