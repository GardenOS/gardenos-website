import type { CreatePaymentOrderInput, PaymentOrder, PaymentStatus } from "@/backend/payments/payment";

export type PaymentRepository = {
  create(input: CreatePaymentOrderInput & { id: string }): Promise<PaymentOrder>;
  updateStatus(input: {
    id: string;
    status: PaymentStatus;
    providerPaymentId?: string;
    providerSessionId?: string;
  }): Promise<PaymentOrder | null>;
  findById(id: string): Promise<PaymentOrder | null>;
};

const memoryStore = new Map<string, PaymentOrder>();

function nowIso(): string {
  return new Date().toISOString();
}

export const inMemoryPaymentRepository: PaymentRepository = {
  async create(input) {
    const now = nowIso();
    const order: PaymentOrder = {
      id: input.id,
      amountMinor: input.amountMinor,
      currency: input.currency,
      email: input.email,
      description: input.description,
      paymentMethod: input.paymentMethod,
      providerId: input.providerId,
      metadata: input.metadata ?? {},
      status: "pending",
      providerSessionId: null,
      providerPaymentId: null,
      createdAt: now,
      updatedAt: now,
    };

    memoryStore.set(order.id, order);
    return order;
  },

  async updateStatus(input) {
    const existing = memoryStore.get(input.id);
    if (!existing) {
      return null;
    }

    const updated: PaymentOrder = {
      ...existing,
      status: input.status,
      providerPaymentId: input.providerPaymentId ?? existing.providerPaymentId,
      providerSessionId: input.providerSessionId ?? existing.providerSessionId,
      updatedAt: nowIso(),
    };

    memoryStore.set(input.id, updated);
    return updated;
  },

  async findById(id) {
    return memoryStore.get(id) ?? null;
  },
};
