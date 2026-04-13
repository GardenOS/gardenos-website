import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BASE_ID = "appVcxgsLlVnnY3RD";
const DEFAULT_TABLE_ID = "tblxlxijrK3zJqAYA";

type Body = {
  name?: string;
  email?: string;
  organization?: string;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { name, email, organization, notes } = (await req.json()) as Body;

    const token = process.env.AIRTABLE_TOKEN?.trim();
    if (!token) {
      return NextResponse.json({ error: "Missing AIRTABLE_TOKEN" }, { status: 500 });
    }

    const emailTrimmed = typeof email === "string" ? email.trim() : "";
    if (!emailTrimmed) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const baseId = process.env.AIRTABLE_BASE_ID?.trim() || DEFAULT_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID?.trim() || DEFAULT_TABLE_ID;

    const fields: Record<string, string> = {
      fldOxGDc3DFJNnrOI: typeof name === "string" ? name.trim() : "",
      fldL59yygf319CsJ6: emailTrimmed,
      fldtunhClMnHCknYo: "Other",
    };

    const extra = [organization, notes]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim())
      .join(" | ");

    if (extra) {
      fields.fld1VWNyLrPWaxyg1 = extra;
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = (await res.json()) as unknown;

    if (!res.ok) {
      console.error("Airtable error:", data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("register route:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
