# Error Handling Strategy

> **Purpose:** How errors are caught, classified, and returned. Claude MUST use these patterns for all error handling.

---

## Error Classification

| Category | HTTP Status | When to Use | Example |
|----------|------------|-------------|---------|
| Validation Error | 400 | DTO validation fails | Missing required field, invalid email format |
| Authentication Error | 401 | No token, expired token, invalid credentials | Wrong password, expired JWT |
| Authorization Error | 403 | Insufficient role or not resource owner | Customer accessing admin endpoint |
| Not Found | 404 | Resource doesn't exist | GET /products/nonexistent-uuid |
| Conflict | 409 | Duplicate or state conflict | Duplicate email, insufficient stock |
| Business Rule Violation | 422 | Valid input but violates business logic | Invalid order status transition |
| Rate Limit | 429 | Too many requests | 6th login attempt in 60 seconds |
| Server Error | 500 | Unhandled/unexpected error | Database connection lost |

---

## Exception Class Hierarchy

```
HttpException (NestJS built-in)
├── BadRequestException (400)
├── UnauthorizedException (401)
├── ForbiddenException (403)
├── NotFoundException (404)
├── ConflictException (409)
├── UnprocessableEntityException (422)
└── InternalServerErrorException (500)

Custom (extend HttpException):
├── BusinessException (422) — base for domain errors
│   ├── InsufficientStockException
│   ├── InvalidOrderTransitionException
│   └── InvalidPaymentTransitionException
├── EntityNotFoundException (404) — includes entity type
└── DuplicateEntityException (409) — includes field name
```

---

## GlobalExceptionFilter

Located at: `src/common/filters/global-exception.filter.ts`

### Behavior

```
catch(exception):
  1. If ValidationException (from ValidationPipe):
     → 400 { error: { code: "VALIDATION_FAILED", message: "...", details: [...field errors] } }

  2. If HttpException (including custom):
     → Use exception's status code
     → Extract error code from exception.getResponse()
     → Format into envelope

  3. If TypeORM QueryFailedError:
     → If unique constraint violation → 409
     → If FK constraint violation → 400
     → Otherwise → 500

  4. If unknown error:
     → 500 { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }
     → Log full stack trace with requestId
     → NEVER expose stack trace in response
```

### Error Response Format

Every error response follows this exact shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": null
  }
}
```

`details` is optional and varies by error type:
- Validation: array of `{ field, message }` objects
- Business: object with context-specific fields
- Auth: null (don't leak info)

---

## Error Codes Reference

### Auth Errors
| Code | Status | When |
|------|--------|------|
| INVALID_CREDENTIALS | 401 | Wrong email or password |
| TOKEN_EXPIRED | 401 | JWT past expiry |
| TOKEN_INVALID | 401 | JWT malformed or tampered |
| REFRESH_TOKEN_MISSING | 401 | No cookie on refresh |
| SESSION_NOT_FOUND | 401 | Refresh token revoked |
| USER_DEACTIVATED | 403 | is_active = false |
| FORBIDDEN | 403 | Insufficient role |
| NOT_OWNER | 403 | Accessing another user's resource |

### User Errors
| Code | Status | When |
|------|--------|------|
| USER_NOT_FOUND | 404 | UUID doesn't match any user |
| EMAIL_EXISTS | 409 | Registration with existing email |

### Product Errors
| Code | Status | When |
|------|--------|------|
| PRODUCT_NOT_FOUND | 404 | UUID doesn't match any product |
| CATEGORY_NOT_FOUND | 404 | Category UUID invalid |
| INSUFFICIENT_STOCK | 409 | Stock < requested quantity |

### Order Errors
| Code | Status | When |
|------|--------|------|
| ORDER_NOT_FOUND | 404 | UUID doesn't match any order |
| CART_EMPTY | 400 | Checkout with empty cart |
| INVALID_ORDER_TRANSITION | 422 | e.g., shipped → pending |

### Payment Errors
| Code | Status | When |
|------|--------|------|
| PAYMENT_NOT_FOUND | 404 | UUID doesn't match any payment |
| PAYMENT_ALREADY_PROCESSED | 409 | Confirm on success/refunded payment |
| INVALID_PAYMENT_TRANSITION | 422 | Invalid state change |
| MAX_RETRIES_EXCEEDED | 422 | retry_count >= 3 |
| IDEMPOTENCY_KEY_MISSING | 400 | No header on initiation |

### Generic Errors
| Code | Status | When |
|------|--------|------|
| VALIDATION_FAILED | 400 | DTO validation fails |
| RATE_LIMIT_EXCEEDED | 429 | Throttler triggered |
| INTERNAL_ERROR | 500 | Unhandled exception |

---

## Service-Layer Error Patterns

### Pattern: Check and Throw

```typescript
// GOOD — explicit check, descriptive error
const product = await this.productsRepository.findOne({ where: { id } });
if (!product) {
  throw new NotFoundException('PRODUCT_NOT_FOUND', `Product ${id} not found`);
}

// BAD — generic error, no context
const product = await this.productsRepository.findOneOrFail({ where: { id } });
// TypeORM's EntityNotFoundError has poor error messages
```

### Pattern: Ownership Check

```typescript
const order = await this.ordersRepository.findOne({ where: { id: orderId } });
if (!order) {
  throw new NotFoundException('ORDER_NOT_FOUND', `Order ${orderId} not found`);
}
if (order.userId !== currentUserId) {
  throw new ForbiddenException('NOT_OWNER', 'You do not have access to this order');
}
```

### Pattern: State Transition Validation

```typescript
const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled', 'payment_failed'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  payment_failed: ['pending'],  // retry payment
  refunded: [],
};

if (!validTransitions[order.status].includes(newStatus)) {
  throw new BusinessException(
    'INVALID_ORDER_TRANSITION',
    `Cannot transition from ${order.status} to ${newStatus}`,
  );
}
```

---

## Logging on Errors

| Error Type | Log Level | What to Log |
|-----------|-----------|-------------|
| 400 Validation | warn | Fields that failed, requestId |
| 401 Auth failure | warn | Email (masked), IP, requestId |
| 403 Forbidden | warn | UserId, attempted resource, requestId |
| 404 Not Found | debug | Entity type, ID, requestId |
| 409 Conflict | info | Entity type, conflicting field, requestId |
| 422 Business | info | Error code, context, requestId |
| 429 Rate Limit | warn | IP, endpoint, requestId |
| 500 Internal | error | Full stack trace, requestId, userId |
