# Queue System Design

> **Purpose:** BullMQ queue definitions for async processing. Claude MUST follow these patterns for all background jobs.

---

## Stack: BullMQ 5.x + Redis

### Connection

```
BullModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    connection: {
      host: new URL(config.get('REDIS_URL')).hostname,
      port: parseInt(new URL(config.get('REDIS_URL')).port),
      db: 1,  // Separate from cache (db 0)
    },
  }),
  inject: [ConfigService],
})
```

---

## Queue Definitions

### 1. payment-processing

**Purpose:** Simulate async payment gateway processing

| Field | Value |
|-------|-------|
| Queue name | `payment-processing` |
| Concurrency | 5 |
| Max retries | 0 (failures are intentional simulation) |
| Timeout | 30 seconds |

**Job data:**
```json
{
  "paymentId": "uuid",
  "method": "card",
  "amount": 599.00
}
```

**Worker logic:**
1. Load payment from DB
2. Update status → processing, log transaction
3. Wait random(MIN_DELAY, MAX_DELAY) milliseconds
4. Roll success/failure based on method's success rate
5. If success: set gateway_ref, status → success, log transaction, emit event
6. If failure: set failure_reason, status → failed, log transaction, emit event

---

### 2. refund-processing

**Purpose:** Process refund requests

| Field | Value |
|-------|-------|
| Queue name | `refund-processing` |
| Concurrency | 3 |
| Max retries | 2 |
| Retry delay | 5 seconds |

**Job data:**
```json
{
  "paymentId": "uuid",
  "reason": "Customer requested"
}
```

**Worker logic:**
1. Load payment from DB
2. Verify status is refund_requested
3. Wait 1-3 seconds (simulate processing)
4. Update status → refunded
5. Log transaction (type: refund)
6. Emit RefundCompletedEvent

---

### 3. notification-dispatch (Phase 7)

**Purpose:** Create notifications asynchronously to not block request handlers

| Field | Value |
|-------|-------|
| Queue name | `notification-dispatch` |
| Concurrency | 10 |
| Max retries | 3 |
| Retry delay | 2 seconds |

**Job data:**
```json
{
  "userId": "uuid",
  "type": "order_confirmed",
  "title": "Order Confirmed",
  "body": "Your order #MZN-000123 has been confirmed",
  "metadata": { "orderId": "uuid" }
}
```

---

### 4. cart-cleanup (Phase 7)

**Purpose:** Remove stale carts older than 24 hours

| Field | Value |
|-------|-------|
| Queue name | `cart-cleanup` |
| Schedule | Cron: every day at 3:00 AM |
| Concurrency | 1 |

**Worker logic:**
1. Query carts with updated_at < NOW() - 24 hours
2. Delete cart_items for each stale cart
3. Log count of cleaned carts

---

## Queue Monitoring

In development, use BullMQ's built-in `getJobCounts()`:

```
GET /admin/queues (admin only)
Response:
{
  "data": {
    "payment-processing": { "waiting": 0, "active": 1, "completed": 45, "failed": 5 },
    "refund-processing": { "waiting": 0, "active": 0, "completed": 3, "failed": 0 }
  }
}
```

---

## Error Handling in Workers

- Workers catch all errors internally
- Failed jobs are logged with error details
- Payment processing failures are EXPECTED (simulation) — not treated as errors
- Only infrastructure failures (Redis down, DB unreachable) are logged as errors
- Dead letter queue: not needed for MVP (failed payments stay in failed state for user to retry)

---

## Testing Queues

- In unit tests: mock the queue — don't process jobs
- In E2E tests: use `InMemoryQueueAdapter` or process jobs synchronously
- Set `PAYMENT_MIN_DELAY_MS=0` and `PAYMENT_MAX_DELAY_MS=0` in test env for instant processing
