import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { getLiveEventById } from "@/backend/live-events/repository";
import { queueRsvpInvite } from "@/backend/notifications/service";
import { getDbPool } from "@/backend/db/client";
import { hasInviteBeenSent } from "@/backend/live-events/inviteRecords";

export const runtime = "nodejs";

interface SendInviteBody {
  eventId: string;
  email: string;
  lang?: 'zh' | 'en';
  force?: boolean;
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const body = (await request.json()) as SendInviteBody;
    const { eventId, email, lang, force } = body;

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: "eventId is required and must be a string" }, { status: 400 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "email is required and must be a string" }, { status: 400 });
    }

    // Get event
    const event = await getLiveEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const alreadySent = await hasInviteBeenSent(eventId, email);
    if (alreadySent && !force) {
      return NextResponse.json(
        {
          error: "Invite already sent for this event and user",
          alreadySent: true,
          needsConfirm: true,
        },
        { status: 409 }
      );
    }

    // Get registration to determine language if not provided
    let userLang = lang;
    if (!userLang) {
      const db = getDbPool();
      const result = await db.query(
        `
          SELECT lang FROM public.registrations
          WHERE email = $1 AND is_active = true
          LIMIT 1
        `,
        [email.trim().toLowerCase()]
      );
      if (result.rows.length > 0) {
        userLang = result.rows[0].lang || 'zh';
      } else {
        userLang = 'zh';
      }
    }

    // Queue the invite
    const result = await queueRsvpInvite({
      event,
      email,
      lang: userLang as 'zh' | 'en',
    });

    if (!result.queued) {
      return NextResponse.json(
        { error: `Failed to send invite: ${result.reason}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Invite sent to ${email}`,
    });
  } catch (error) {
    return errorJson(error);
  }
}
