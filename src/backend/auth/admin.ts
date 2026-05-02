import { auth, currentUser } from "@clerk/nextjs/server";
import { ForbiddenError, UnauthorizedError } from "@/backend/common/errors";
import { isEmailInInternalWhitelist } from "@/backend/auth/internalWhitelist";

function getAdminUserIds(): Set<string> {
  const raw = process.env.LIVE_ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  );
}

export async function requireAdminUser(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError("Please sign in first.");

  const admins = getAdminUserIds();
  if (admins.has(userId)) {
    return { userId };
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  if (!email) {
    throw new ForbiddenError("You are not allowed to perform this operation.");
  }

  const inWhitelist = await isEmailInInternalWhitelist(email);
  if (!inWhitelist) {
    throw new ForbiddenError("You are not allowed to perform this operation.");
  }

  return { userId };
}

export async function isCurrentUserInternal(): Promise<boolean> {
  try {
    await requireAdminUser();
    return true;
  } catch {
    return false;
  }
}
