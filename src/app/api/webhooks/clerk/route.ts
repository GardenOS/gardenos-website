import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";

type AirtableCreateRecordsPayload = {
  records: Array<{
    fields: Record<string, unknown>;
  }>;
};

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

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!apiKey || !baseId || !tableName) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Server is missing AIRTABLE_API_KEY / AIRTABLE_BASE_ID / AIRTABLE_TABLE_NAME environment variables.",
      },
      { status: 500 }
    );
  }

  const payload: AirtableCreateRecordsPayload = {
    records: [
      {
        fields: {
          Email: email,
          "Full Name": fullName || undefined,
          "Clerk User ID": clerkUserId,
        },
      },
    ],
  };

  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Clerk webhook: Airtable create failed", res.status, text);
    return NextResponse.json(
      { ok: false, error: "Airtable request failed.", status: res.status },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
