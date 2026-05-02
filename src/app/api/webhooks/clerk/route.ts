import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { insertClerkUserIntake } from "@/backend/intake/repository";

export const runtime = "nodejs";

function primaryEmailFromUser(data: {
  id: string;
  primary_email_address_id: string | null;
  email_addresses: Array<{ id: string; email_address: string }>;
}): string {
  const { primary_email_address_id, email_addresses } = data;
  if (!email_addresses?.length) return "";
  const byPrimary =
    primary_email_address_id != null
      ? email_addresses.find((e) => e.id === primary_email_address_id)
      : undefined;
  const chosen = byPrimary ?? email_addresses[0];
  return (chosen.email_address ?? "").trim();
}

export async function POST(request: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Webhook verification failed." }, { status: 400 });
  }

  if (evt.type !== "user.created") {
    return NextResponse.json({ ok: true, skipped: evt.type });
  }

  const data = evt.data;
  const email = primaryEmailFromUser(data);
  const clerkUserId = data.id;
  const firstName = (data.first_name ?? "").trim();
  const lastName = (data.last_name ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (!email) {
    return NextResponse.json({ ok: false, error: "User has no email address." }, { status: 400 });
  }

  await insertClerkUserIntake({
    email,
    fullName: fullName || null,
    clerkUserId,
  });

  return NextResponse.json({ ok: true });
}
