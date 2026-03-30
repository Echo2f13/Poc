# Caching Strategy

> **Purpose:** What to cache, where, and how to invalidate. Claude MUST follow these patterns when adding caching.

---

## Cache Layer: Redis 7

Connection via `ioredis`. Separate from BullMQ Redis (same server, different db index):
- Cache: Redis DB 0
- BullMQ: Redis DB 1

---

## Cache Targets

| Target | Key Pattern | TTL | When to Invalidate |
|--------|-------------|-----|-------------------|
| Product list (page) | `cache:products:page:{page}:limit:{limit}:sort:{sort}` | 5 min | Product CREATE/UPDATE/DELETE |
| Single product | `cache:product:{id}` | 10 min | Product UPDATE/DELETE |
| Category tree | `cache:categories:tree` | 30 min | Category CREATE/UPDATE/DELETE |
| User profile | `cache:user:{id}` | 5 min | User UPDATE |
| Feature flags | `cache:flags:all` | 5 min | Flag UPDATE |
| Unread notification count | `cache:notifications:unread:{userId}` | 1 min | Notification CREATE/READ |
| Analytics (admin dashboard) | `cache:analytics:{dateRange}` | 15 min | Cron refresh |

---

## Cache-Aside Pattern

```
GET /products:
  1. Check Redis for cache:products:page:1:limit:20
  2. If HIT → return cached data
  3. If MISS → query PostgreSQL
  4. Store result in Redis with TTL
  5. Return data
```

## Invalidation Pattern

```
POST /products (create):
  1. Insert into PostgreSQL
  2. Delete all keys matching cache:products:*
  3. (Don't pre-populate — let next GET refill cache)

PATCH /products/:id (update):
  1. Update in PostgreSQL
  2. Delete cache:product:{id}
  3. Delete all keys matching cache:products:*

DELETE /products/:id:
  1. Soft-delete in PostgreSQL
  2. Delete cache:product:{id}
  3. Delete all keys matching cache:products:*
```

---

## When NOT to Cache

- Cart data (changes frequently, low read-to-write ratio)
- Payment status (must always be real-time from DB)
- Audit logs (append-only, rarely read the same data twice)
- Order detail (changes state, user expects real-time status)

---

## Implementation Phase

Caching is a **Phase 7+ optimization**. Do NOT add caching before the core features are stable. Premature caching adds complexity and hides bugs.

**Add caching only when:**
1. All CRUD operations are tested and working
2. Pagination is implemented
3. You have measurable performance data showing a bottleneck
