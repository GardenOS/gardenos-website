import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { NotFoundError, ValidationError } from "@/backend/common/errors";
import { createAuditLog } from "@/backend/audit/repository";
import { deleteRegistrationById } from "@/backend/intake/repository";

type Props = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: Props) {
  try {
    const { userId } = await requireAdminUser();
    const { id } = await params;
    const registrationId = Number(id);

    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      throw new ValidationError("Invalid registration id.");
    }

    const deleted = await deleteRegistrationById(registrationId);
    if (!deleted) {
      throw new NotFoundError("Registration not found.");
    }

    await createAuditLog({
      entityType: "registration",
      entityId: String(registrationId),
      action: "deleted",
      actorUserId: userId,
      beforeData: {
        email: deleted.email,
        fullName: deleted.fullName,
        liveEventId: deleted.liveEventId,
      },
    });

    return NextResponse.json({ ok: true, id: registrationId });
  } catch (error) {
    return errorJson(error);
  }
}
