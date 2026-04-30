import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { validateStatusInput } from "@/backend/live-events/validators";
import { updateLiveEventStatusService } from "@/backend/live-events/service";

type Props = {
  params: Promise<{ eventId: string }>;
};

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { userId } = await requireAdminUser();
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const status = validateStatusInput(body);
    const event = await updateLiveEventStatusService(eventId, status, userId);
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return errorJson(error);
  }
}
