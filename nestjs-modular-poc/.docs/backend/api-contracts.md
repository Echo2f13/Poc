# API Contracts

> **Purpose:** Complete endpoint reference with request/response schemas. Claude MUST consult this when implementing or modifying any endpoint. Frontend developers use this as the integration contract.

---

## Base URL

- Development: `http://localhost:3000/api/v1`
- Production: `https://example.com/api/v1`

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | On protected routes | `Bearer <access_token>` |
| Content-Type | On POST/PATCH | `application/json` |
| Idempotency-Key | On payment initiation | UUID v4 |

## Common Response Formats

**Success (single resource):**
```json
{ "data": { ... } }
```

**Success (list):**
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

**Error:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

**Validation Error (400):**
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "email must be a valid email address" },
      { "field": "name", "message": "name must be at least 2 characters" }
    ]
  }
}
```

---

## Auth Endpoints

### POST /auth/register
**Auth:** Public

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| name | string | 2-100 chars | Yes |
| email | string | Valid email | Yes |
| password | string | Min 8 chars | Yes |

**201 Response:**
```json
{
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "uuid", "name": "John", "email": "john@example.com", "role": "customer" }
  }
}
```
**Set-Cookie:** `refreshToken=...; HttpOnly; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`

**Errors:** 400 (validation), 409 (EMAIL_EXISTS)

---

### POST /auth/login
**Auth:** Public

| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**200 Response:** Same as register
**Errors:** 401 (INVALID_CREDENTIALS), 403 (USER_DEACTIVATED)

---

### POST /auth/refresh
**Auth:** Cookie (refresh token)
**Body:** None

**200 Response:**
```json
{ "data": { "accessToken": "eyJ..." } }
```
**Set-Cookie:** New refresh token (rotation)
**Errors:** 401 (TOKEN_EXPIRED, TOKEN_INVALID)

---

### POST /auth/logout
**Auth:** Bearer token
**Body:** None
**204 Response:** No body

---

## User Endpoints

### GET /users/me
**Auth:** Any authenticated user

**200 Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "ISO8601"
  }
}
```

---

### PATCH /users/me
**Auth:** Any authenticated user

| Field | Type | Required |
|-------|------|----------|
| name | string | No |
| email | string | No |
| password | string | No |

**200 Response:** Updated user object

---

### GET /users (Admin)
**Auth:** Admin

**Query:** `?page=1&limit=20&search=john&role=customer&isActive=true`

**200 Response:** Paginated user list

---

## Product Endpoints

### GET /products
**Auth:** Public

**Query:** `?page=1&limit=20&search=phone&category=electronics&minPrice=100&maxPrice=1000&sort=price&order=asc`

**200 Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 15",
      "description": "Latest Apple smartphone",
      "price": 999.99,
      "stock": 50,
      "category": { "id": "uuid", "name": "Electronics", "slug": "electronics" },
      "imageUrl": "/uploads/iphone15.jpg",
      "averageRating": 4.5,
      "reviewCount": 23,
      "createdAt": "ISO8601"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 200, "totalPages": 10 }
}
```

---

### GET /products/:id
**Auth:** Public

**200 Response:** Single product with full details + reviews
**Errors:** 404 (PRODUCT_NOT_FOUND)

---

### POST /products (Admin)
**Auth:** Admin

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| name | string | 2-255 chars | Yes |
| description | string | Optional | No |
| price | number | > 0 | Yes |
| stock | integer | >= 0 | Yes |
| categoryId | UUID | Must exist | No |
| imageUrl | string | Valid URL | No |

**201 Response:** Created product
**Errors:** 400 (validation)

---

### PATCH /products/:id (Admin)
**Auth:** Admin

Same fields as POST, all optional.
**200 Response:** Updated product
**Errors:** 404 (PRODUCT_NOT_FOUND)

---

### DELETE /products/:id (Admin)
**Auth:** Admin
**204 Response:** No body (soft delete)

---

## Cart Endpoints

### GET /cart
**Auth:** Customer

**200 Response:**
```json
{
  "data": {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "product": { "id": "uuid", "name": "iPhone 15", "price": 999.99, "stock": 50, "imageUrl": "..." },
        "quantity": 2
      }
    ],
    "subtotal": 1999.98,
    "itemCount": 2
  }
}
```

---

### POST /cart/items
**Auth:** Customer

| Field | Type | Required |
|-------|------|----------|
| productId | UUID | Yes |
| quantity | integer (>0) | Yes |

**201 Response:** Updated cart
**Errors:** 404 (PRODUCT_NOT_FOUND), 409 (INSUFFICIENT_STOCK)

---

### PATCH /cart/items/:itemId
**Auth:** Customer

| Field | Type | Required |
|-------|------|----------|
| quantity | integer (>0) | Yes |

**200 Response:** Updated cart

---

### DELETE /cart/items/:itemId
**Auth:** Customer
**204 Response:** No body

---

### POST /cart/checkout
**Auth:** Customer

| Field | Type | Required |
|-------|------|----------|
| addressId | UUID | Yes |

**201 Response:**
```json
{
  "data": {
    "orderId": "uuid",
    "total": 1079.98,
    "status": "pending"
  }
}
```
**Errors:** 400 (CART_EMPTY), 409 (INSUFFICIENT_STOCK for any item)

---

## Order Endpoints

### GET /orders
**Auth:** Customer (own orders) / Admin (all orders)

**Query:** `?page=1&limit=20&status=confirmed`

**200 Response:** Paginated order list with items and payment status

---

### GET /orders/:id
**Auth:** Customer (owner) / Admin

**200 Response:**
```json
{
  "data": {
    "id": "uuid",
    "status": "confirmed",
    "items": [
      { "id": "uuid", "product": { "id": "uuid", "name": "iPhone 15" }, "quantity": 2, "unitPrice": 999.99 }
    ],
    "subtotal": 1999.98,
    "tax": 159.99,
    "total": 2159.97,
    "payment": { "id": "uuid", "status": "success", "method": "card" },
    "address": { "street": "...", "city": "...", "state": "...", "zip": "..." },
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```
**Errors:** 404 (ORDER_NOT_FOUND), 403 (NOT_OWNER)

---

### PATCH /orders/:id/cancel
**Auth:** Customer (owner)

**Validation:** Order must be in `pending` or `confirmed` status

**200 Response:** Updated order with status `cancelled`
**Errors:** 422 (INVALID_ORDER_TRANSITION)

---

## Payment Endpoints

See [payments.md](../payments/payments.md) for full payment API contracts.

### POST /payments/initiate → 201
### POST /payments/:id/confirm → 200
### GET /payments/:id → 200
### POST /payments/:id/refund → 200 (Admin)
### GET /admin/payments → 200 (Admin)
### PATCH /admin/payments/:id/override → 200 (Super Admin)

---

## Notification Endpoints

### GET /notifications
**Auth:** Customer (own)

**Query:** `?page=1&limit=20&unreadOnly=true`

**200 Response:** Paginated notification list

---

### PATCH /notifications/:id/read
**Auth:** Customer (owner)
**200 Response:** Updated notification

---

### GET /notifications/unread-count
**Auth:** Customer
**200 Response:**
```json
{ "data": { "count": 5 } }
```

---

## Admin Endpoints

### GET /admin/analytics
**Auth:** Admin

**Query:** `?from=ISO8601&to=ISO8601`

**200 Response:**
```json
{
  "data": {
    "revenue": { "total": 50000.00, "today": 2500.00 },
    "orders": { "total": 500, "today": 25, "byStatus": { "pending": 5, "confirmed": 10, "delivered": 400 } },
    "users": { "total": 200, "today": 5 },
    "payments": { "successRate": 85.5, "totalProcessed": 450 },
    "topProducts": [
      { "id": "uuid", "name": "iPhone 15", "revenue": 15000.00, "unitsSold": 15 }
    ]
  }
}
```

---

### GET /admin/audit-logs
**Auth:** Admin

**Query:** `?page=1&limit=50&entityType=order&action=UPDATE&userId=uuid&from=ISO8601&to=ISO8601`

**200 Response:** Paginated audit log entries

---

## Health Endpoints

### GET /health
**Auth:** Public
**200 Response:** `{ "status": "ok", "info": { "app": { "status": "up" } } }`

### GET /health/ready
**Auth:** Public
**200 Response:** `{ "status": "ok", "info": { "database": { "status": "up" }, "redis": { "status": "up" } } }`
**503 Response:** If any dependency is down
