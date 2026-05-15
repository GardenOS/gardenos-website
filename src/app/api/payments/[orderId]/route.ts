import { NextResponse } from "next/server";
import { ValidationError } from "@/backend/common/errors";
import { errorJson } from "@/backend/common/http";
import { getPaymentService } from "@/backend/payments/service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params;
    const normalizedOrderId = String(orderId ?? "").trim();
    if (!normalizedOrderId) {
      throw new ValidationError("orderId is required.");
    }

    const order = await getPaymentService().getOrder(normalizedOrderId);
    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    return errorJson(error);
  }
}
