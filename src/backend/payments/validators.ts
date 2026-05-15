import { ValidationError } from "@/backend/common/errors";
import type { CreateCheckoutSessionInput, PaymentCurrency, PaymentMethod } from "@/backend/payments/payment";

const ALLOWED_CURRENCIES: ReadonlySet<PaymentCurrency> = new Set(["NZD", "USD"]);
const ALLOWED_PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set(["online_eftpos", "apple_pay", "card"]);

function assertPositiveMinorAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ValidationError("amountMinor must be a positive integer.");
  }

  return amount;
}

function assertCurrency(value: unknown): PaymentCurrency {
  const currency = String(value ?? "").toUpperCase() as PaymentCurrency;
  if (!ALLOWED_CURRENCIES.has(currency)) {
    throw new ValidationError("currency must be one of: NZD, USD.");
  }

  return currency;
}

function assertPaymentMethod(value: unknown): PaymentMethod {
  const method = String(value ?? "").trim().toLowerCase() as PaymentMethod;
  if (!ALLOWED_PAYMENT_METHODS.has(method)) {
    throw new ValidationError("paymentMethod must be one of: online_eftpos, apple_pay, card.");
  }

  return method;
}

function assertEmail(value: unknown): string {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new ValidationError("email is required and must be a valid email address.");
  }

  return email;
}

function assertRequiredString(value: unknown, field: string): string {
  const result = String(value ?? "").trim();
  if (!result) {
    throw new ValidationError(`${field} is required.`);
  }

  return result;
}

function normalizeMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, val]) => [String(key).trim(), String(val ?? "").trim()] as const)
    .filter(([key, val]) => Boolean(key) && Boolean(val));

  return Object.fromEntries(entries);
}

function assertUrl(value: unknown, field: string): string {
  const raw = assertRequiredString(value, field);
  try {
    return new URL(raw).toString();
  } catch {
    throw new ValidationError(`${field} must be a valid absolute URL.`);
  }
}

export function validateCreateCheckoutInput(payload: Record<string, unknown>): CreateCheckoutSessionInput {
  return {
    amountMinor: assertPositiveMinorAmount(payload.amountMinor),
    currency: assertCurrency(payload.currency),
    email: assertEmail(payload.email),
    description: assertRequiredString(payload.description, "description"),
    paymentMethod: assertPaymentMethod(payload.paymentMethod),
    metadata: normalizeMetadata(payload.metadata),
    successUrl: assertUrl(payload.successUrl, "successUrl"),
    cancelUrl: assertUrl(payload.cancelUrl, "cancelUrl"),
  };
}
