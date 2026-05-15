import { createHmac, timingSafeEqual } from "crypto";
import { AppError, ValidationError } from "@/backend/common/errors";
import type {
  PaymentMethod,
  PaymentProviderId,
  PaymentWebhookEvent,
} from "@/backend/payments/payment";

export type CreateProviderCheckoutSessionInput = {
  orderId: string;
  paymentMethod: PaymentMethod;
  amountMinor: number;
  currency: string;
  email: string;
  description: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
};

export type CreateProviderCheckoutSessionResult = {
  checkoutUrl: string;
  providerSessionId: string;
};

export type PaymentProvider = {
  id: PaymentProviderId;
  supportedMethods: ReadonlyArray<PaymentMethod>;
  isConfigured(): boolean;
  createCheckoutSession(input: CreateProviderCheckoutSessionInput): Promise<CreateProviderCheckoutSessionResult>;
  parseWebhookEvent(payload: string, signature: string | null): PaymentWebhookEvent;
};

function baseSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? "https://mygardenos.com" : "http://localhost:9090";
}

function buildMockCheckoutUrl(orderId: string, successUrl: string): string {
  const url = new URL(successUrl || baseSiteUrl());
  url.searchParams.set("mockPay", "1");
  url.searchParams.set("orderId", orderId);
  return url.toString();
}

function parseSimpleWebhookPayload(payload: string): PaymentWebhookEvent {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    throw new ValidationError("Invalid webhook payload JSON.");
  }

  const type = String(parsed.type ?? "").trim();
  const orderId = String(parsed.orderId ?? "").trim();
  const providerPaymentId = String(parsed.providerPaymentId ?? "").trim() || undefined;

  if (!orderId) {
    throw new ValidationError("webhook orderId is required.");
  }

  if (type !== "payment.succeeded" && type !== "payment.failed" && type !== "payment.canceled") {
    throw new ValidationError("Unsupported webhook type.");
  }

  return { type, orderId, providerPaymentId };
}

function verifySha256Signature(secret: string, signature: string | null, payload: string): void {
  if (!signature) {
    throw new ValidationError("Missing webhook signature.");
  }

  const digest = createHmac("sha256", secret).update(payload).digest("hex");
  const expected = Buffer.from(digest);
  const actual = Buffer.from(signature.trim());
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ValidationError("Invalid webhook signature.");
  }
}

function parseStripeSignature(signature: string | null): { timestamp: string; v1: string } {
  if (!signature) {
    throw new ValidationError("Missing Stripe signature.");
  }

  const parts = signature.split(",").map((item) => item.trim());
  const timestamp = parts.find((item) => item.startsWith("t="))?.slice(2) ?? "";
  const v1 = parts.find((item) => item.startsWith("v1="))?.slice(3) ?? "";
  if (!timestamp || !v1) {
    throw new ValidationError("Invalid Stripe signature header format.");
  }

  return { timestamp, v1 };
}

function verifyStripeWebhookSignature(payload: string, signature: string | null): void {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return;
  }

  const parsed = parseStripeSignature(signature);
  const signedPayload = `${parsed.timestamp}.${payload}`;
  const digest = createHmac("sha256", secret).update(signedPayload).digest("hex");

  const expected = Buffer.from(digest);
  const actual = Buffer.from(parsed.v1);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ValidationError("Invalid Stripe webhook signature.");
  }
}

function extractStripeEvent(payload: string): PaymentWebhookEvent {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    throw new ValidationError("Invalid Stripe webhook payload JSON.");
  }

  const stripeType = String(parsed.type ?? "").trim();
  const data = (parsed.data ?? {}) as Record<string, unknown>;
  const object = (data.object ?? {}) as Record<string, unknown>;
  const metadata = (object.metadata ?? {}) as Record<string, unknown>;
  const orderId = String(metadata.orderId ?? metadata.order_id ?? "").trim();
  const providerPaymentId = String(object.payment_intent ?? object.id ?? "").trim() || undefined;

  if (!orderId) {
    throw new ValidationError("Stripe webhook metadata.orderId is required.");
  }

  if (stripeType === "checkout.session.completed" || stripeType === "payment_intent.succeeded") {
    return { type: "payment.succeeded", orderId, providerPaymentId };
  }

  if (stripeType === "payment_intent.payment_failed") {
    return { type: "payment.failed", orderId, providerPaymentId };
  }

  if (stripeType === "checkout.session.expired") {
    return { type: "payment.canceled", orderId, providerPaymentId };
  }

  throw new ValidationError(`Unsupported Stripe event type: ${stripeType || "unknown"}.`);
}

export const mockPaymentProvider: PaymentProvider = {
  id: "mock",
  supportedMethods: ["online_eftpos", "apple_pay", "card"],

  isConfigured() {
    return true;
  },

  async createCheckoutSession(input) {
    const providerSessionId = `mock_session_${input.orderId}`;
    return {
      providerSessionId,
      checkoutUrl: buildMockCheckoutUrl(input.orderId, input.successUrl),
    };
  },

  parseWebhookEvent(payload) {
    return parseSimpleWebhookPayload(payload);
  },
};

export const stripePaymentProvider: PaymentProvider = {
  id: "stripe",
  supportedMethods: ["apple_pay", "card"],

  isConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  },

  async createCheckoutSession(input) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeSecret) {
      throw new AppError("Stripe provider is not configured.", 503);
    }

    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", input.successUrl);
    body.set("cancel_url", input.cancelUrl);
    body.set("customer_email", input.email);
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", input.currency.toLowerCase());
    body.set("line_items[0][price_data][unit_amount]", String(input.amountMinor));
    body.set("line_items[0][price_data][product_data][name]", input.description);
    body.set("payment_method_types[0]", "card");
    body.set("metadata[orderId]", input.orderId);

    for (const [key, value] of Object.entries(input.metadata)) {
      body.set(`metadata[${key}]`, value);
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const reason = String((raw.error as Record<string, unknown> | undefined)?.message ?? "Stripe API error");
      throw new AppError(`Stripe checkout creation failed: ${reason}`, 502);
    }

    const providerSessionId = String(raw.id ?? "").trim();
    const checkoutUrl = String(raw.url ?? "").trim();
    if (!providerSessionId || !checkoutUrl) {
      throw new AppError("Stripe response missing id or url.", 502);
    }

    return {
      providerSessionId,
      checkoutUrl,
    };
  },

  parseWebhookEvent(payload, signature) {
    verifyStripeWebhookSignature(payload, signature);
    return extractStripeEvent(payload);
  },
};

export const eftposPaymentProvider: PaymentProvider = {
  id: "eftpos",
  supportedMethods: ["online_eftpos"],

  isConfigured() {
    return Boolean(process.env.EFTPOS_API_BASE_URL?.trim() && process.env.EFTPOS_API_TOKEN?.trim());
  },

  async createCheckoutSession(input) {
    const baseUrl = process.env.EFTPOS_API_BASE_URL?.trim();
    const token = process.env.EFTPOS_API_TOKEN?.trim();
    if (!baseUrl || !token) {
      throw new AppError("EFTPOS provider is not configured.", 503);
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/checkout/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: input.orderId,
        amountMinor: input.amountMinor,
        currency: input.currency,
        email: input.email,
        description: input.description,
        paymentMethod: input.paymentMethod,
        metadata: input.metadata,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      }),
    });

    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const reason = String(raw.message ?? raw.error ?? "EFTPOS API error");
      throw new AppError(`EFTPOS checkout creation failed: ${reason}`, 502);
    }

    const providerSessionId = String(raw.sessionId ?? raw.id ?? "").trim();
    const checkoutUrl = String(raw.checkoutUrl ?? raw.url ?? "").trim();
    if (!providerSessionId || !checkoutUrl) {
      throw new AppError("EFTPOS response missing session id or checkout url.", 502);
    }

    return {
      providerSessionId,
      checkoutUrl,
    };
  },

  parseWebhookEvent(payload, signature) {
    const secret = process.env.EFTPOS_WEBHOOK_SECRET?.trim();
    if (secret) {
      verifySha256Signature(secret, signature, payload);
    }

    return parseSimpleWebhookPayload(payload);
  },
};

export function getPaymentProviders(): ReadonlyArray<PaymentProvider> {
  return [stripePaymentProvider, eftposPaymentProvider, mockPaymentProvider];
}
