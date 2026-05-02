import { NextResponse } from "next/server";
import { errorJson } from "@/backend/common/http";
import { requireAdminUser } from "@/backend/auth/admin";
import {
  listInternalWhitelistEmails,
  removeInternalWhitelistEmail,
} from "@/backend/auth/internalWhitelist";

type Props = {
  params: Promise<{ email: string }>;
};

export const runtime = "nodejs";

export async function DELETE(_: Request, { params }: Props) {
  try {
    await requireAdminUser();
    const { email } = await params;
    await removeInternalWhitelistEmail(decodeURIComponent(email));
    const emails = await listInternalWhitelistEmails();
    return NextResponse.json({ ok: true, emails });
  } catch (error) {
    return errorJson(error);
  }
}
