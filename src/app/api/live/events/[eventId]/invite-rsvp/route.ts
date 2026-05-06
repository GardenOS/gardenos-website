import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { sendRsvpInviteEmailsService } from "@/backend/live-events/service";

type Props = {
  params: Promise<{ eventId: string }>;
};

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: Props) {
  try {
    const { userId } = await requireAdminUser();
    const { eventId } = await params;

    const result = await sendRsvpInviteEmailsService(eventId, userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorJson(error);
  }
}
