# Implementation Roadmap

> **Purpose:** Ordered implementation plan. Claude MUST follow this sequence — each phase depends on the previous one.

---

## Phase 0: Foundation (CURRENT)
**Status:** Complete
**What exists:**
- NestJS project scaffold with 3 modules (Users, Products, Orders)
- In-memory data stores with seed data
- Vanilla HTML/CSS/JS frontend (5 pages)
- Basic CRUD endpoints (no validation, no auth)

---

## Phase 1: Database & Persistence
**Status:** Not Started
**Depends on:** Phase 0
**Goal:** Replace in-memory arrays with PostgreSQL via TypeORM

### Tasks:
1. Install TypeORM, pg, @nestjs/config dependencies
2. Create .env.example and .env.development
3. Configure ConfigModule with Joi validation
4. Configure TypeORM DataSource
5. Create User entity with all columns
6. Create Product entity with Category entity
7. Create Order entity with OrderItem entity
8. Create Cart entity with CartItem entity
9. Create Payment entity with Transaction entity
10. Create remaining entities (Review, Notification, AuditLog, Session, FeatureFlag)
11. Generate initial migration
12. Create dev seed script
13. Refactor UsersService to use TypeORM repository
14. Refactor ProductsService to use TypeORM repository
15. Refactor OrdersService to use TypeORM repository
16. Add docker-compose.yml with PostgreSQL and Redis
17. Verify all existing endpoints still work with DB persistence
18. Add pagination to all list endpoints

**Verification:** Server restarts preserve data. All existing endpoints return same shape.

---

## Phase 2: Authentication & Authorization
**Status:** Not Started
**Depends on:** Phase 1
**Goal:** JWT auth with bcrypt passwords and RBAC guards

### Tasks:
1. Install @nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt, helmet
2. Create AuthModule with JwtStrategy
3. Create auth DTOs (RegisterDto, LoginDto)
4. Implement POST /auth/register (bcrypt hash, create user, return tokens)
5. Implement POST /auth/login (validate credentials, return tokens)
6. Implement POST /auth/refresh (token rotation via httpOnly cookie)
7. Implement POST /auth/logout (delete session)
8. Create JwtAuthGuard (global, with @Public() bypass)
9. Create RolesGuard with @Roles() decorator
10. Create @CurrentUser() param decorator
11. Apply JwtAuthGuard globally
12. Mark public routes with @Public()
13. Add role checks to admin endpoints
14. Add ownership checks in services (orders, cart)
15. Register helmet middleware
16. Configure CORS with credentials
17. Add @nestjs/throttler for rate limiting
18. Create Session entity and track logins

**Verification:** Unauthenticated requests to protected endpoints return 401. Wrong role returns 403. Login returns valid JWT.

---

## Phase 3: Validation & Error Handling
**Status:** Not Started
**Depends on:** Phase 2
**Goal:** Runtime validation on all inputs, structured error responses

### Tasks:
1. Install class-validator, class-transformer
2. Register global ValidationPipe in main.ts
3. Add validation decorators to ALL existing DTOs
4. Create new DTOs for missing endpoints (UpdateUserDto, QueryProductsDto, etc.)
5. Create GlobalExceptionFilter
6. Create custom exception classes (BusinessException, etc.)
7. Create TransformInterceptor for response envelope
8. Add proper HTTP status codes to all controllers
9. Add error codes to all thrown exceptions
10. Test: invalid input returns 400 with field errors
11. Test: not found returns 404 with entity type
12. Test: duplicate email returns 409

**Verification:** POST /users with empty body returns 400 with validation errors. POST /users with duplicate email returns 409. All responses follow envelope format.

---

## Phase 4: Payment System
**Status:** Not Started
**Depends on:** Phase 3
**Goal:** Mock payment gateway with state machine, queue processing, transaction logging

### Tasks:
1. Install @nestjs/bullmq, bullmq, ioredis, @nestjs/event-emitter
2. Create PaymentsModule
3. Implement Payment entity and Transaction entity (already created in Phase 1)
4. Implement PaymentsService with state machine validation
5. Implement POST /payments/initiate with idempotency
6. Implement POST /payments/:id/confirm
7. Implement GET /payments/:id (with transaction history)
8. Create PaymentProcessorService (simulation engine)
9. Create payment-processing BullMQ queue and worker
10. Implement success/failure simulation with configurable rates
11. Implement event emission (PaymentSucceeded, PaymentFailed)
12. Create event handlers: update order status on payment result
13. Create event handlers: decrement stock on payment success
14. Implement POST /payments/:id/refund (admin)
15. Implement PATCH /admin/payments/:id/override (super_admin)
16. Implement GET /admin/payments (list with filters)
17. Add transaction logging on every state transition

**Verification:** Payment flows through all states. Failed payments can be retried. Transactions are logged immutably. Events trigger order status updates.

---

## Phase 5: Cart & Checkout
**Status:** Not Started
**Depends on:** Phase 4
**Goal:** Full cart-to-order flow

### Tasks:
1. Create CartModule
2. Implement CartService with cart CRUD
3. Implement POST /cart/items (add to cart)
4. Implement PATCH /cart/items/:id (update quantity)
5. Implement DELETE /cart/items/:id (remove item)
6. Implement GET /cart (with product details and totals)
7. Implement POST /cart/checkout (create order from cart)
8. Stock validation on checkout (verify availability)
9. Price snapshot on order creation

**Verification:** Add items to cart, checkout creates order with correct totals, cart is cleared after checkout.

---

## Phase 6: Admin & Audit
**Status:** Not Started
**Depends on:** Phase 5
**Goal:** Admin management endpoints and audit logging

### Tasks:
1. Create AdminModule with admin-only endpoints
2. Admin: GET /admin/users (list, search, filter)
3. Admin: PATCH /admin/users/:id (deactivate, role change)
4. Admin: GET /admin/orders (list with filters)
5. Admin: PATCH /admin/orders/:id/status (update order status)
6. Admin: GET /admin/analytics (revenue, order counts, top products)
7. Create AuditModule with AuditInterceptor
8. Log all state-changing operations to audit_logs
9. Admin: GET /admin/audit-logs (list with filters)

**Verification:** Admin can manage users, orders. All mutations create audit log entries. Analytics return correct aggregates.

---

## Phase 7: Notifications & Polish
**Status:** Not Started
**Depends on:** Phase 6
**Goal:** In-app notifications, logging, health checks

### Tasks:
1. Create NotificationsModule
2. Auto-create notifications on order/payment events
3. GET /notifications (user's notifications)
4. PATCH /notifications/:id/read
5. GET /notifications/unread-count
6. Install nestjs-pino, configure structured logging
7. Create RequestIdMiddleware
8. Install @nestjs/terminus, create health check endpoints
9. Create LoggingInterceptor for request/response timing

**Verification:** Notifications appear after order/payment events. Logs are structured JSON. /health returns 200.

---

## Phase 8: Frontend Migration (React)
**Status:** Not Started
**Depends on:** Phase 7
**Goal:** Replace vanilla HTML/JS with React + TypeScript SPA

### Tasks:
1. Scaffold Vite + React + TypeScript project in /frontend
2. Install TanStack Query, Zustand, React Router, React Hook Form, Zod, Tailwind
3. Create shared components (Button, Input, Layout, Skeleton, Toast)
4. Create API client with auth interceptors
5. Implement auth pages (Login, Register)
6. Implement product pages (List with search/filter, Detail)
7. Implement cart (drawer + page)
8. Implement checkout + payment flow
9. Implement order pages (List, Detail with timeline)
10. Implement admin pages (Dashboard, Users, Products, Orders, Payments, Audit)
11. Implement notifications (bell + dropdown)
12. Implement user profile + session management

**Verification:** All flows from vanilla frontend work in React. Auth flow works end-to-end. Admin panel functional.

---

## Phase 9: DevOps & Production Readiness
**Status:** Not Started
**Depends on:** Phase 8
**Goal:** Docker, CI/CD, production deployment

### Tasks:
1. Create Dockerfile (multi-stage)
2. Create docker-compose.yml (dev)
3. Create docker-compose.prod.yml
4. Create nginx.conf
5. Create GitHub Actions CI workflow
6. Create GitHub Actions deploy workflow
7. Create .env.example
8. Write unit tests (target: 70% coverage on services)
9. Write E2E tests for critical flows
10. Production smoke test script

**Verification:** `docker-compose up` starts full stack. CI pipeline passes. Deploy script works.

---

## Milestone Summary

| Phase | What | Depends On | Priority |
|-------|------|-----------|----------|
| 1 | Database + Persistence | Phase 0 | MUST-HAVE |
| 2 | Auth + RBAC | Phase 1 | MUST-HAVE |
| 3 | Validation + Errors | Phase 2 | MUST-HAVE |
| 4 | Payment System | Phase 3 | MUST-HAVE |
| 5 | Cart + Checkout | Phase 4 | MUST-HAVE |
| 6 | Admin + Audit | Phase 5 | HIGH-VALUE |
| 7 | Notifications + Observability | Phase 6 | HIGH-VALUE |
| 8 | Frontend Migration | Phase 7 | HIGH-VALUE |
| 9 | DevOps + Production | Phase 8 | HIGH-VALUE |
