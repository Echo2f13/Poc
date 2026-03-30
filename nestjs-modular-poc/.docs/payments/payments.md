# Payment System Design

> **Purpose:** Complete specification for the mock payment gateway. Claude MUST follow this state machine and API contract exactly. This system simulates real-world payment behavior for demo purposes.

## Design Philosophy

This is NOT a simple success/failure toggle. It simulates a **real payment provider** with:
- Asynchronous processing (queue-based)
- State machine with strict transitions
- Transaction logging (immutable)
- Failure simulation with realistic decline codes
- Idempotency protection
- Admin override for testing

---

## Payment State Machine

```
                    ┌─────────────┐
           create   │  INITIATED  │  (payment intent created, no method yet)
                    └──────┬──────┘
                           │ confirm (submit card/UPI details)
                    ┌──────▼──────┐
                    │   PENDING   │  (details received, queued for processing)
                    └──────┬──────┘
                           │ BullMQ worker picks up job
                    ┌──────▼──────┐
                    │ PROCESSING  │  (simulated gateway delay 2-5s)
                    └──────┬──────┘
                      ┌────┴────┐
                ┌─────▼───┐ ┌───▼─────┐
                │ SUCCESS  │ │ FAILED  │
                └─────┬───┘ └───┬─────┘
                      │         │
                      │         └──→ retry (back to INITIATED, max 3x)
                      │
               (admin requests refund)
          ┌───────────▼──────────┐
          │  REFUND_REQUESTED    │
          └───────────┬──────────┘
                      │ (auto-process via queue)
               ┌──────▼──────┐
               │   REFUNDED  │
               └─────────────┘
```

### Valid State Transitions

| From | To | Trigger |
|------|----|---------|
| initiated | pending | Customer confirms with payment details |
| pending | processing | BullMQ worker picks up job |
| processing | success | Simulation roll: success |
| processing | failed | Simulation roll: decline/timeout |
| failed | initiated | Customer retries (retry_count < 3) |
| success | refund_requested | Admin initiates refund |
| refund_requested | refunded | Refund processing completes |

**Any other transition is INVALID and must be rejected with INVALID_PAYMENT_TRANSITION error.**

---

## API Contracts

### POST /api/v1/payments/initiate

**Auth:** Customer (authenticated)

**Headers:**
- `Idempotency-Key: <UUID>` (REQUIRED)

**Body:**
```json
{
  "orderId": "uuid"
}
```

**Validation:**
- Order must exist
- Order must belong to current user
- Order status must be `pending`
- No existing payment in non-failed state for this order
- Idempotency key must be unique (or return existing payment if duplicate)

**Response (201):**
```json
{
  "data": {
    "paymentId": "uuid",
    "orderId": "uuid",
    "amount": 599.00,
    "status": "initiated",
    "createdAt": "ISO8601"
  }
}
```

**Idempotency behavior:** If `Idempotency-Key` matches an existing payment, return that payment with 200 (not 201). Do NOT create a duplicate.

---

### POST /api/v1/payments/:id/confirm

**Auth:** Customer (owner of the payment)

**Body (card):**
```json
{
  "method": "card",
  "details": {
    "cardNumber": "4242424242424242",
    "expiryMonth": 12,
    "expiryYear": 2028,
    "cvv": "123",
    "cardholderName": "John Doe"
  }
}
```

**Body (UPI):**
```json
{
  "method": "upi",
  "details": {
    "upiId": "user@paytm"
  }
}
```

**Body (COD):**
```json
{
  "method": "cod",
  "details": {}
}
```

**Validation:**
- Payment must be in `initiated` or `failed` state
- retry_count must be < 3 (if retrying from failed)
- Card number: 16 digits (no Luhn check — it's a mock)
- UPI ID: must contain `@`
- COD: no details needed

**Actions:**
1. Store method and details (card number masked: last 4 digits only)
2. Update status → pending
3. Increment retry_count if retrying
4. Enqueue `payment-processing` BullMQ job
5. Log transaction (initiated → pending)

**Response (200):**
```json
{
  "data": {
    "paymentId": "uuid",
    "status": "pending",
    "method": "card"
  }
}
```

---

### GET /api/v1/payments/:id

**Auth:** Customer (owner) or Admin

**Response (200):**
```json
{
  "data": {
    "paymentId": "uuid",
    "orderId": "uuid",
    "method": "card",
    "status": "success",
    "amount": 599.00,
    "gatewayRef": "GW_AUTH_38291",
    "failureReason": null,
    "retryCount": 0,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "transactions": [
      {
        "id": "uuid",
        "type": "charge",
        "fromStatus": "initiated",
        "toStatus": "pending",
        "amount": 599.00,
        "createdAt": "ISO8601"
      },
      {
        "id": "uuid",
        "type": "charge",
        "fromStatus": "processing",
        "toStatus": "success",
        "amount": 599.00,
        "gatewayResponse": {
          "approvalCode": "AUTH_38291",
          "network": "visa",
          "last4": "4242"
        },
        "createdAt": "ISO8601"
      }
    ]
  }
}
```

---

### POST /api/v1/payments/:id/refund

**Auth:** Admin only

**Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Validation:**
- Payment must be in `success` state
- Order status must not be `delivered` (no refunds after delivery in this demo)

**Actions:**
1. Update payment status → refund_requested
2. Enqueue refund-processing job
3. Log transaction

---

### GET /api/v1/admin/payments

**Auth:** Admin only

**Query params:** `?status=failed&method=card&page=1&limit=20&from=ISO8601&to=ISO8601`

**Response:** Paginated list of all payments with meta.

---

### PATCH /api/v1/admin/payments/:id/override

**Auth:** Super Admin only

**Body:**
```json
{
  "targetStatus": "success",
  "reason": "Testing override"
}
```

**Validation:**
- targetStatus must be `success`, `failed`, or `refunded`
- Payment must not already be in target status

**Actions:**
1. Force-transition to target status
2. Log transaction with `type: 'override'`
3. Log in audit_logs with admin user and reason

---

## Simulation Engine (PaymentProcessorService)

### Processing Logic (BullMQ Worker)

```
1. Receive job { paymentId }
2. Load payment from DB
3. Update status → processing
4. Log transaction (pending → processing)
5. Wait random(PAYMENT_MIN_DELAY_MS, PAYMENT_MAX_DELAY_MS)
6. Roll outcome:
   - card: PAYMENT_CARD_SUCCESS_RATE% chance of success
   - upi: PAYMENT_UPI_SUCCESS_RATE% chance of success
   - cod: 100% success (always)
7. If success:
   - Generate gateway_ref: "GW_AUTH_" + random 5-digit number
   - Update payment: status → success, gateway_ref set
   - Log transaction (processing → success) with gateway_response
   - Emit PaymentSucceededEvent
8. If failure:
   - Pick random decline code from list
   - Update payment: status → failed, failure_reason set
   - Log transaction (processing → failed) with decline reason
   - Emit PaymentFailedEvent
```

### Decline Codes

| Code | Description | When Used |
|------|-------------|-----------|
| insufficient_funds | Card has insufficient balance | Card only |
| card_expired | Card expiration date has passed | Card only |
| do_not_honor | Bank declined without specific reason | Card only |
| fraud_suspected | Transaction flagged as potentially fraudulent | Card only |
| upi_timeout | UPI server did not respond in time | UPI only |
| upi_pin_invalid | Incorrect UPI PIN entered | UPI only |
| gateway_timeout | Payment gateway timed out | Any method |

### Simulation Config

Stored as environment variables (not DB feature flags at MVP):

| Env Var | Default | Range |
|---------|---------|-------|
| PAYMENT_CARD_SUCCESS_RATE | 80 | 0-100 |
| PAYMENT_UPI_SUCCESS_RATE | 90 | 0-100 |
| PAYMENT_MIN_DELAY_MS | 2000 | 500-10000 |
| PAYMENT_MAX_DELAY_MS | 5000 | 1000-30000 |
| PAYMENT_TIMEOUT_RATE | 5 | 0-100 |

---

## Event System

| Event | Emitted By | Consumed By | Action |
|-------|-----------|-------------|--------|
| PaymentSucceededEvent | PaymentProcessorService | OrdersService | Order status → confirmed |
| PaymentSucceededEvent | PaymentProcessorService | ProductsService | Decrement stock |
| PaymentSucceededEvent | PaymentProcessorService | NotificationsService | Create "Order confirmed" notification |
| PaymentFailedEvent | PaymentProcessorService | OrdersService | Order status → payment_failed |
| PaymentFailedEvent | PaymentProcessorService | NotificationsService | Create "Payment failed" notification |
| RefundCompletedEvent | PaymentProcessorService | OrdersService | Order status → refunded |

Implementation: NestJS `@nestjs/event-emitter` (in-process events, not HTTP webhooks).

---

## Transaction Logging Rules

1. Every state transition creates exactly ONE transaction record
2. Transactions are IMMUTABLE — never updated or deleted
3. Transaction records include `from_status` and `to_status` for auditability
4. Gateway responses are stored as JSONB for flexible querying
5. Admin overrides are logged as `type: 'override'` with reason in gateway_response
