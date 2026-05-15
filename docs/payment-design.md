# Payment Module Design

## Goals
- Keep payment logic independent from framework runtime details.
- Allow running inside current Next.js project now, but easy to extract into a standalone microservice later.
- Support staged channel enablement: configure API keys/tokens later without changing business flow.

## Current Module Layout
- Domain types: src/backend/payments/payment.ts
- Input validation: src/backend/payments/validators.ts
- Provider adapters: src/backend/payments/provider.ts
- Application service: src/backend/payments/service.ts
- Repository interface and temporary in-memory implementation: src/backend/payments/repository.ts
- API routes (HTTP adapters):
  - src/app/api/payments/checkout/route.ts
  - src/app/api/payments/webhook/route.ts
  - src/app/api/payments/[orderId]/route.ts

## Supported Payment Methods
- online_eftpos
- apple_pay
- card

## Provider Strategy
Provider IDs:
- stripe
- eftpos
- mock

Method to provider routing in service:
- online_eftpos -> eftpos -> mock fallback
- apple_pay -> stripe -> mock fallback
- card -> stripe -> mock fallback

Mock fallback is controlled by:
- PAYMENT_ALLOW_MOCK_FALLBACK (default true unless explicitly set to false)

## API Contracts
### 1) Create checkout session
POST /api/payments/checkout

Request body:
- amountMinor: number (minor unit, integer > 0)
- currency: NZD | USD
- email: string
- description: string
- paymentMethod: online_eftpos | apple_pay | card
- metadata?: Record<string, string>
- successUrl: absolute URL
- cancelUrl: absolute URL

Response:
- ok: true
- data:
  - orderId
  - checkoutUrl
  - providerSessionId
  - providerId
  - paymentMethod

### 2) Payment webhook
POST /api/payments/webhook?provider=stripe|eftpos|mock

Provider can also be passed by header:
- x-payment-provider

Signature headers accepted:
- stripe-signature
- x-eftpos-signature
- x-payment-signature

Behavior:
- Parse provider-specific event
- Map to internal status: succeeded | failed | canceled
- Verify provider matches order.providerId
- Persist status update

### 3) Query order status
GET /api/payments/{orderId}

Response:
- ok: true
- data: full order object including providerId, paymentMethod, status

## Webhook Security
Stripe:
- Uses STRIPE_WEBHOOK_SECRET when configured
- Verifies Stripe signature format t=...,v1=...

EFTPOS:
- Uses EFTPOS_WEBHOOK_SECRET when configured
- Verifies SHA-256 HMAC signature

## Environment Variables
Main env example:
- .env.local.example

Channel-specific templates:
- .env.payment.stripe.example
- .env.payment.eftpos.example
- .env.payment.mock.example

Variables:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- EFTPOS_API_BASE_URL
- EFTPOS_API_TOKEN
- EFTPOS_WEBHOOK_SECRET
- PAYMENT_ALLOW_MOCK_FALLBACK

## Data Model (Current)
PaymentOrder fields:
- id
- amountMinor
- currency
- email
- description
- paymentMethod
- providerId
- metadata
- status (pending, processing, succeeded, failed, canceled)
- providerSessionId
- providerPaymentId
- createdAt
- updatedAt

## Audit Logging
On checkout creation:
- action: checkout_session_created
- includes providerId, paymentMethod, amount, email, providerSessionId

On webhook processing:
- action: webhook_processed
- includes providerId, event type, mapped status, providerPaymentId

## Migration to Microservice
To extract with minimum change:
1. Move src/backend/payments/* to new service repo.
2. Keep interfaces unchanged (PaymentProvider, PaymentRepository).
3. Replace in-memory repository with DB-backed repository.
4. Keep HTTP endpoints and payload contracts compatible.
5. Route webhook endpoints from current app to the new service.

## Production Readiness Checklist
- Replace in-memory repository with persistent storage.
- Add idempotency key handling for checkout creation.
- Add webhook replay protection and deduplication.
- Add integration tests per provider.
- Set PAYMENT_ALLOW_MOCK_FALLBACK=false in production.
- Ensure provider-specific monitoring and alerting.

## Notes
- stripe provider implementation currently uses direct Stripe API fetch (Checkout Session).
- eftpos provider currently uses a generic endpoint contract and may need field/path adjustments for your chosen vendor.
