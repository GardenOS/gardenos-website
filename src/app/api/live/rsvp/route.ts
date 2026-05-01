import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { errorJson } from "@/backend/common/http";
import { validateCreateRsvpInput } from "@/backend/rsvp/validators";
import { createRsvpService } from "@/backend/rsvp/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { userId } = await auth();

    let payload = body;
    if (userId) {
      const user = await currentUser();
      const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
      const clerkFullName = user?.fullName ?? [user?.firstName, user?.lastName].filter(Boolean).join(" ");

      payload = {
        ...body,
        email: String(body.email ?? "").trim() || clerkEmail,
        fullName: String(body.fullName ?? "").trim() || clerkFullName,
      };
    }

    const input = validateCreateRsvpInput(payload);
    const rsvp = await createRsvpService(input);
    return NextResponse.json({ ok: true, rsvp });
  } catch (error) {
    return errorJson(error);
  }
}
