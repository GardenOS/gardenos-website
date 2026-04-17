import { NextResponse } from "next/server";

type AirtableCreateRecordsPayload = {
  records: Array<{
    fields: Record<string, unknown>;
  }>;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const wechatId = String(formData.get("wechatId") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const preferredContact = String(formData.get("preferredContact") ?? "").trim();
    const language = String(formData.get("language") ?? "").trim();
    const subscriptionPlan = String(formData.get("subscriptionPlan") ?? "").trim();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
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
            "Full Name": fullName || undefined,
            "WeChat ID": wechatId || undefined,
            Phone: phone || undefined,
            Email: email,
            "Preferred Contact": preferredContact || undefined,
            Language: language || undefined,
            "Subscription Plan": subscriptionPlan || undefined,
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
      return NextResponse.json(
        { ok: false, error: "Airtable request failed.", status: res.status, details: text },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unexpected server error while submitting registration." },
      { status: 500 }
    );
  }
}
