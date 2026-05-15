export type PaymentCurrency = "NZD" | "USD";

export type PaymentMethod = "online_eftpos" | "apple_pay" | "card";

export type PaymentProviderId = "stripe" | "eftpos" | "mock";

export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "canceled";

export type PaymentOrder = {
  id: string;
  amountMinor: number;
  currency: PaymentCurrency;
  email: string;
  description: string;
  paymentMethod: PaymentMethod;
  providerId: PaymentProviderId;
  metadata: Record<string, string>;
  status: PaymentStatus;
  providerSessionId: string | null;
  providerPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentOrderInput = {
  amountMinor: number;
  currency: PaymentCurrency;
  email: string;
  description: string;
  paymentMethod: PaymentMethod;
  providerId: PaymentProviderId;
  metadata?: Record<string, string>;
};

export type CreateCheckoutSessionInput = {
  amountMinor: number;
  currency: PaymentCurrency;
  email: string;
  description: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
};

export type CreateCheckoutSessionResult = {
  orderId: string;
  checkoutUrl: string;
  providerSessionId: string;
  providerId: PaymentProviderId;
  paymentMethod: PaymentMethod;
};

export type PaymentWebhookEvent = {
  type: "payment.succeeded" | "payment.failed" | "payment.canceled";
  orderId: string;
  providerPaymentId?: string;
};
