import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { deleteLiveEventService, updateLiveEventService } from "@/backend/live-events/service";
import { validateUpdateLiveEventInput } from "@/backend/live-events/validators";

type Props = {
  params: Promise<{ eventId: string }>;
};

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { userId } = await requireAdminUser();
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const input = validateUpdateLiveEventInput(body);
    const event = await updateLiveEventService(eventId, input, userId);
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return errorJson(error);
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const { userId } = await requireAdminUser();
    const { eventId } = await params;
    const event = await deleteLiveEventService(eventId, userId);
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return errorJson(error);
  }
}