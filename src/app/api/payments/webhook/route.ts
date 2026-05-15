import { NextResponse } from "next/server";
import { ValidationError } from "@/backend/common/errors";
import { errorJson } from "@/backend/common/http";
import { getPaymentService } from "@/backend/payments/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = String(
      url.searchParams.get("provider") ?? request.headers.get("x-payment-provider") ?? ""
    )
      .trim()
      .toLowerCase();

    if (!provider) {
      throw new ValidationError("provider is required in query (?provider=...) or x-payment-provider header.");
    }

    const payload = await request.text();
    const signature =
      request.headers.get("stripe-signature") ??
      request.headers.get("x-eftpos-signature") ??
      request.headers.get("x-payment-signature");

    const order = await getPaymentService().handleWebhook(provider, payload, signature);

    return NextResponse.json({ ok: true, data: { orderId: order.id, status: order.status } });
  } catch (error) {
    return errorJson(error);
  }
}
