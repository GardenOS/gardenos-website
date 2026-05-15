import { randomUUID } from "crypto";
import { AppError, NotFoundError, ValidationError } from "@/backend/common/errors";
import { createAuditLog } from "@/backend/audit/repository";
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentMethod,
  PaymentOrder,
  PaymentProviderId,
  PaymentStatus,
  PaymentWebhookEvent,
} from "@/backend/payments/payment";
import { getPaymentProviders, type PaymentProvider } from "@/backend/payments/provider";
import { inMemoryPaymentRepository, type PaymentRepository } from "@/backend/payments/repository";

function mapEventToStatus(event: PaymentWebhookEvent): PaymentStatus {
  if (event.type === "payment.succeeded") return "succeeded";
  if (event.type === "payment.failed") return "failed";
  return "canceled";
}

type PaymentServiceDeps = {
  repository: PaymentRepository;
  providers: ReadonlyArray<PaymentProvider>;
};

function shouldAllowMockFallback(): boolean {
  return process.env.PAYMENT_ALLOW_MOCK_FALLBACK?.trim() !== "false";
}

function normalizeProviderId(value: string): PaymentProviderId {
  if (value === "stripe" || value === "eftpos" || value === "mock") {
    return value;
  }

  throw new ValidationError("provider must be one of: stripe, eftpos, mock.");
}

function providerPriorityByMethod(method: PaymentMethod): ReadonlyArray<PaymentProviderId> {
  if (method === "online_eftpos") {
    return ["eftpos", "mock"];
  }

  return ["stripe", "mock"];
}

export class PaymentService {
  constructor(private readonly deps: PaymentServiceDeps) {}

  private findProviderById(providerId: PaymentProviderId): PaymentProvider {
    const provider = this.deps.providers.find((item) => item.id === providerId);
    if (!provider) {
      throw new ValidationError("Unknown payment provider.");
    }

    return provider;
  }

  private resolveProviderByMethod(paymentMethod: PaymentMethod): PaymentProvider {
    const allowMock = shouldAllowMockFallback();
    const priority = providerPriorityByMethod(paymentMethod);

    for (const providerId of priority) {
      if (providerId === "mock" && !allowMock) {
        continue;
      }

      const provider = this.deps.providers.find((item) => item.id === providerId);
      if (!provider) {
        continue;
      }

      if (!provider.supportedMethods.includes(paymentMethod)) {
        continue;
      }

      if (!provider.isConfigured() && provider.id !== "mock") {
        continue;
      }

      return provider;
    }

    throw new AppError(`No available provider for paymentMethod=${paymentMethod}.`, 503);
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
    const orderId = randomUUID();
    const provider = this.resolveProviderByMethod(input.paymentMethod);

    await this.deps.repository.create({
      id: orderId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      email: input.email,
      description: input.description,
      paymentMethod: input.paymentMethod,
      providerId: provider.id,
      metadata: input.metadata ?? {},
    });

    const providerSession = await provider.createCheckoutSession({
      orderId,
      paymentMethod: input.paymentMethod,
      amountMinor: input.amountMinor,
      currency: input.currency,
      email: input.email,
      description: input.description,
      metadata: input.metadata ?? {},
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });

    await this.deps.repository.updateStatus({
      id: orderId,
      status: "processing",
      providerSessionId: providerSession.providerSessionId,
    });

    await createAuditLog({
      entityType: "payment",
      entityId: orderId,
      action: "checkout_session_created",
      afterData: {
        providerId: provider.id,
        paymentMethod: input.paymentMethod,
        amountMinor: input.amountMinor,
        currency: input.currency,
        email: input.email,
        providerSessionId: providerSession.providerSessionId,
      },
    });

    return {
      orderId,
      checkoutUrl: providerSession.checkoutUrl,
      providerSessionId: providerSession.providerSessionId,
      providerId: provider.id,
      paymentMethod: input.paymentMethod,
    };
  }

  async handleWebhook(providerValue: string, payload: string, signature: string | null): Promise<PaymentOrder> {
    const providerId = normalizeProviderId(providerValue.trim());
    const provider = this.findProviderById(providerId);
    const event = provider.parseWebhookEvent(payload, signature);
    const status = mapEventToStatus(event);

    const existingOrder = await this.deps.repository.findById(event.orderId);
    if (!existingOrder) {
      throw new NotFoundError("Payment order not found.");
    }

    if (existingOrder.providerId !== providerId) {
      throw new ValidationError("Webhook provider does not match order provider.");
    }

    const updated = await this.deps.repository.updateStatus({
      id: event.orderId,
      status,
      providerPaymentId: event.providerPaymentId,
    });

    if (!updated) {
      throw new NotFoundError("Payment order not found.");
    }

    await createAuditLog({
      entityType: "payment",
      entityId: updated.id,
      action: "webhook_processed",
      afterData: {
        providerId,
        type: event.type,
        status,
        providerPaymentId: event.providerPaymentId ?? null,
      },
    });

    return updated;
  }

  async getOrder(orderId: string): Promise<PaymentOrder> {
    const order = await this.deps.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Payment order not found.");
    }

    return order;
  }
}

let singletonService: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  if (!singletonService) {
    singletonService = new PaymentService({
      repository: inMemoryPaymentRepository,
      providers: getPaymentProviders(),
    });
  }

  return singletonService;
}
