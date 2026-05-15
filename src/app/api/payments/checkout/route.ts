import { NextResponse } from "next/server";
import { errorJson } from "@/backend/common/http";
import { getPaymentService } from "@/backend/payments/service";
import { validateCreateCheckoutInput } from "@/backend/payments/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const input = validateCreateCheckoutInput(body);
    const result = await getPaymentService().createCheckoutSession(input);

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return errorJson(error);
  }
}
