import { NextResponse } from "next/server";
import { errorJson } from "@/backend/common/http";
import { requireAdminUser } from "@/backend/auth/admin";
import {
  addInternalWhitelistEmail,
  listInternalWhitelistEmails,
} from "@/backend/auth/internalWhitelist";
import { ValidationError } from "@/backend/common/errors";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    await requireAdminUser();
    const emails = await listInternalWhitelistEmails();
    return NextResponse.json({ ok: true, emails });
  } catch (error) {
    return errorJson(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new ValidationError("A valid email is required.");
    }

    await addInternalWhitelistEmail(email, userId);
    const emails = await listInternalWhitelistEmails();
    return NextResponse.json({ ok: true, emails });
  } catch (error) {
    return errorJson(error);
  }
}
