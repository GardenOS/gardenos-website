import { auth } from "@clerk/nextjs/server";
import { ForbiddenError, UnauthorizedError } from "@/backend/common/errors";

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
  if (!admins.size || !admins.has(userId)) {
    throw new ForbiddenError("You are not allowed to perform this operation.");
  }

  return { userId };
}
