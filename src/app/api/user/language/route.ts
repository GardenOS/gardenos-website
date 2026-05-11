import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { setClerkUserLanguagePreference } from "@/backend/intake/repository";

// PATCH: /api/user/language
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as { language?: unknown } | null;
  const language = typeof payload?.language === "string" ? payload.language : "";
  if (language !== "zh" && language !== "en") {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ?? user.emailAddresses[0];
    const email = (primary?.emailAddress ?? "").trim();
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    await setClerkUserLanguagePreference({ clerkUserId: userId, email, language });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update language" }, { status: 500 });
  }
}
