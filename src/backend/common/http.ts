import { NextResponse } from "next/server";
import { toAppError } from "@/backend/common/errors";

export function errorJson(error: unknown) {
  const appError = toAppError(error);
  return NextResponse.json({ ok: false, error: appError.message }, { status: appError.statusCode });
}
