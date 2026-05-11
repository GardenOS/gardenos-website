import { NextResponse } from "next/server";
import { createRsvpService } from "@/backend/rsvp/service";
import { verifyRsvpInviteToken } from "@/backend/rsvp/inviteToken";
import { getLiveEventById } from "@/backend/live-events/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json(
        { success: false, reason: "no_token", message: "Token is required" },
        { status: 400 }
      );
    }

    const payload = verifyRsvpInviteToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, reason: "invalid_token", message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Get event details for response
    let eventTitle = "GardenOS Live Event";
    let eventTime: string | undefined;

    try {
      const event = await getLiveEventById(payload.eventId);
      if (event) {
        eventTitle = event.title || event.titleEn || eventTitle;
        if (event.scheduledStartAt) {
          eventTime = new Intl.DateTimeFormat(payload.lang === "en" ? "en-NZ" : "zh-CN", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Pacific/Auckland",
          }).format(new Date(event.scheduledStartAt));
        }
      }
    } catch (error) {
      console.error("[rsvp] Failed to fetch event details:", error);
    }

    // Create RSVP
    await createRsvpService({
      eventId: payload.eventId,
      email: payload.email,
      source: "email-invite-one-click",
      consentMarketing: false,
    });

    return NextResponse.json(
      {
        success: true,
        eventTitle,
        eventTime,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[rsvp/verify] Error:", error);

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { success: false, reason: "error", message },
      { status: 500 }
    );
  }
}
