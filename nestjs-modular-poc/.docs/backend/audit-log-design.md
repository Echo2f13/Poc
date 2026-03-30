# Audit Log Design

> **Purpose:** What gets audited, how it's captured, and how it's queried.

---

## What Gets Audited

| Entity | Actions Logged | Captured Fields |
|--------|---------------|----------------|
| User | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ROLE_CHANGE | old/new values for UPDATE, role change details |
| Product | CREATE, UPDATE, DELETE | old/new price, stock, name changes |
| Order | CREATE, UPDATE (status change) | old/new status, who changed it |
| Payment | CREATE, UPDATE (state transition), OVERRIDE | from/to status, override reason |
| Feature Flag | UPDATE | old/new enabled state, who toggled |

---

## Capture Mechanism

### Option A: AuditInterceptor (Recommended for Phase 6)

A NestJS interceptor that wraps controller handlers:

```
1. Before handler: snapshot entity state (if UPDATE/DELETE)
2. Execute handler
3. After handler: snapshot new state
4. Async write to audit_logs (via queue or direct insert)
```

**Applied via decorator:** `@Audited('product')` on controller methods that should be logged.

### Option B: TypeORM Subscribers (Alternative)

Entity subscribers that fire on `afterInsert`, `afterUpdate`, `afterRemove`.

**Downside:** No access to request context (userId, IP, userAgent). Would need AsyncLocalStorage to pass request context.

**Decision:** Use Option A (AuditInterceptor) because it has full access to the request object.

---

## Audit Log Schema

```
audit_logs:
  id: UUID PK
  user_id: UUID FK→users (nullable for system actions)
  action: VARCHAR(50) — CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ROLE_CHANGE, OVERRIDE
  entity_type: VARCHAR(50) — user, product, order, payment, feature_flag
  entity_id: UUID
  old_values: JSONB (null for CREATE)
  new_values: JSONB (null for DELETE)
  ip_address: INET
  user_agent: VARCHAR(500)
  created_at: TIMESTAMPTZ
```

### Example Entries

**Product price change:**
```json
{
  "id": "uuid",
  "userId": "admin-uuid",
  "action": "UPDATE",
  "entityType": "product",
  "entityId": "product-uuid",
  "oldValues": { "price": 999.99, "stock": 50 },
  "newValues": { "price": 899.99, "stock": 50 },
  "ipAddress": "192.168.1.1",
  "createdAt": "2026-03-25T10:30:00Z"
}
```

**User login:**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "action": "LOGIN",
  "entityType": "user",
  "entityId": "user-uuid",
  "oldValues": null,
  "newValues": null,
  "ipAddress": "203.0.113.42",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2026-03-25T10:30:00Z"
}
```

**Payment override:**
```json
{
  "id": "uuid",
  "userId": "superadmin-uuid",
  "action": "OVERRIDE",
  "entityType": "payment",
  "entityId": "payment-uuid",
  "oldValues": { "status": "failed" },
  "newValues": { "status": "success", "reason": "Testing override" },
  "ipAddress": "10.0.0.1",
  "createdAt": "2026-03-25T10:30:00Z"
}
```

---

## Querying Audit Logs

### Admin Endpoint: GET /admin/audit-logs

**Filters:**
- `entityType` — filter by entity (product, order, etc.)
- `entityId` — filter by specific entity
- `action` — filter by action type
- `userId` — filter by who performed the action
- `from` / `to` — date range

**Sorting:** Always `created_at DESC` (most recent first)

**Pagination:** Standard page/limit

---

## Rules

1. Audit logs are **IMMUTABLE** — never UPDATE or DELETE
2. Audit log writes must NOT fail the main operation — if audit insert fails, log the error but let the original operation succeed
3. Sensitive fields are EXCLUDED from old_values/new_values: password_hash, refresh_token_hash
4. JSONB storage allows flexible schema — different entities have different fields
5. Retention: keep all logs (no auto-cleanup for MVP, add TTL-based cleanup in future)
