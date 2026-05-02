import { NextResponse } from "next/server";
import { insertRegisterIntake } from "@/backend/intake/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const organization = String(formData.get("organization") ?? "").trim();
    const optionalContact = String(formData.get("optionalContact") ?? "").trim();
    const registerLocale = String(formData.get("registerLocale") ?? "").trim();
    const scenarioNeeds = String(formData.get("scenarioNeeds") ?? "").trim();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    await insertRegisterIntake({
      fullName,
      email,
      organization,
      scenarioNeeds,
      registerLocale,
      optionalContact,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unexpected server error while submitting registration." },
      { status: 500 }
    );
  }
}
