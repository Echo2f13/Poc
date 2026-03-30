# Task Tracker

> **Purpose:** Granular, atomic task list. Claude MUST check this before starting work, update status during work, and mark complete after. This is the single source of truth for what to do next.

## Status Legend

- `[ ]` — Pending (not started)
- `[~]` — In Progress
- `[x]` — Done
- `[!]` — Blocked (see notes)

---

## Phase 1: Database & Persistence

### 1.1 Dependencies & Config
- [x] Install production deps: `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `joi`
- [x] Create `.env.example` with all required variables and placeholder values
- [x] Create `.env.development` with local PostgreSQL/Redis connection strings
- [x] Add `.env.development` and `.env.test` to `.gitignore` (verify existing)
- [x] Configure `ConfigModule.forRoot()` in `app.module.ts` with Joi validation schema
- [x] Configure `TypeOrmModule.forRootAsync()` using ConfigService for DATABASE_URL
- [x] Verify app fails fast if DATABASE_URL is missing

### 1.2 Docker Setup (PostgreSQL + Redis)
- [x] Create `docker-compose.yml` with postgres:16-alpine and redis:7-alpine services
- [x] Add adminer service for dev DB browsing
- [x] Add persistent volume for PostgreSQL data
- [x] Test: `docker-compose up -d` starts both services
- [x] Test: can connect to PostgreSQL on localhost:5432

### 1.3 Entities
- [x] Create `src/common/types/enums.ts` with Role, OrderStatus, PaymentStatus, PaymentMethod enums
- [x] Create `src/users/entities/user.entity.ts` — all columns per db.md
- [x] Create `src/users/entities/address.entity.ts`
- [x] Create `src/products/entities/category.entity.ts`
- [x] Create `src/products/entities/product.entity.ts`
- [ ] Create `src/cart/cart.module.ts`, `src/cart/entities/cart.entity.ts`
- [ ] Create `src/cart/entities/cart-item.entity.ts`
- [x] Create `src/orders/entities/order.entity.ts` — with status enum
- [x] Create `src/orders/entities/order-item.entity.ts`
- [ ] Create `src/payments/payments.module.ts`, `src/payments/entities/payment.entity.ts`
- [ ] Create `src/payments/entities/transaction.entity.ts`
- [x] Create `src/products/entities/review.entity.ts`
- [ ] Create `src/notifications/notifications.module.ts`, `src/notifications/entities/notification.entity.ts`
- [ ] Create `src/audit/audit.module.ts`, `src/audit/entities/audit-log.entity.ts`
- [x] Create `src/auth/entities/session.entity.ts`
- [ ] Create `src/admin/entities/feature-flag.entity.ts`

### 1.4 Migration
- [x] Configure TypeORM CLI in `package.json` scripts
- [x] Configure `typeorm.config.ts` (DataSource for CLI)
- [!] Generate initial migration from entities
  - NOTE: synchronize:true is active in dev so tables auto-create. Migrate when switching to production mode.
- [x] Run migration equivalent (synchronize:true created all tables), verify all tables created in PostgreSQL
- [ ] Verify constraints: CHECK(price > 0), CHECK(stock >= 0), UNIQUE(email), etc.

### 1.5 Seed Data
- [ ] Create `seeds/dev.seed.ts` — 50 users, 20 categories, 200 products, 500 orders
- [ ] Add `npm run seed:dev` script to package.json
- [ ] Run seed, verify data in adminer/psql
- [ ] Create `seeds/prod.seed.ts` — 1 super_admin + base categories

### 1.6 Refactor Services
- [x] Refactor `UsersService` — replace in-memory array with TypeORM repository
- [x] Refactor `UsersController` — add pagination params
- [x] Refactor `ProductsService` — replace in-memory array with TypeORM repository
- [x] Refactor `ProductsController` — add pagination params
- [x] Refactor `OrdersService` — replace in-memory array with TypeORM repository
- [x] Refactor `OrdersController` — add pagination, use relations for joins
- [x] Refactor `ReviewsService` — replace in-memory service with TypeORM repository
- [x] Remove all hardcoded seed data from service constructors
- [x] Test: `GET /users` returns paginated response from database
- [x] Test: `POST /users` persists to database, survives restart
- [x] Test: `GET /products` returns paginated response from database
- [x] Test: `GET /orders` returns orders with joined user/product data

### 1.7 Pagination
- [x] Apply pagination to GET /users
- [x] Apply pagination to GET /products
- [x] Apply pagination to GET /orders
- [x] Apply pagination to GET /reviews

---

## Phase 2: Authentication & Authorization

### 2.1 Dependencies
- [ ] Install: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `helmet`, `@nestjs/throttler`
- [ ] Install dev: `@types/passport-jwt`, `@types/bcrypt`

### 2.2 Auth Module
- [ ] Create `src/auth/auth.module.ts`
- [ ] Create `src/auth/auth.controller.ts`
- [ ] Create `src/auth/auth.service.ts`
- [ ] Create `src/auth/strategies/jwt.strategy.ts`
- [ ] Create `src/auth/dto/register.dto.ts` (name, email, password with validation)
- [ ] Create `src/auth/dto/login.dto.ts` (email, password)
- [ ] Implement `POST /api/v1/auth/register`
- [ ] Implement `POST /api/v1/auth/login`
- [ ] Implement `POST /api/v1/auth/refresh`
- [ ] Implement `POST /api/v1/auth/logout`

### 2.3 Guards & Decorators
- [ ] Create `src/common/guards/jwt-auth.guard.ts`
- [ ] Create `src/common/guards/roles.guard.ts`
- [ ] Create `src/common/decorators/public.decorator.ts`
- [ ] Create `src/common/decorators/roles.decorator.ts`
- [ ] Create `src/common/decorators/current-user.decorator.ts`
- [ ] Register JwtAuthGuard globally in app.module.ts
- [ ] Mark public routes: GET /products, POST /auth/login, POST /auth/register, GET /health
- [ ] Add @Roles('admin') to admin-only endpoints

### 2.4 Security Middleware
- [ ] Register `helmet()` in main.ts
- [ ] Configure CORS with credentials and origin whitelist
- [ ] Configure ThrottlerModule (100/min global, 5/min on login)
- [ ] Set global API prefix: `app.setGlobalPrefix('api/v1')`

### 2.5 Verification
- [ ] Test: POST /auth/register creates user with hashed password
- [ ] Test: POST /auth/login returns JWT + sets httpOnly cookie
- [ ] Test: GET /users without token returns 401
- [ ] Test: GET /users with valid token returns 200
- [ ] Test: Customer cannot access admin endpoints (403)
- [ ] Test: Rate limiting triggers on 6th login attempt in 60s

---

## Phase 3: Validation & Error Handling

### 3.1 Dependencies
- [ ] Install: `class-validator`, `class-transformer`

### 3.2 Global Setup
- [ ] Register global ValidationPipe in main.ts
- [ ] Create `src/common/filters/global-exception.filter.ts`
- [ ] Create `src/common/interceptors/transform.interceptor.ts`
- [ ] Register exception filter globally
- [ ] Register transform interceptor globally

### 3.3 DTOs
- [ ] Add validation decorators to CreateUserDto
- [ ] Add validation decorators to CreateProductDto
- [ ] Add validation decorators to CreateOrderDto
- [ ] Create UpdateUserDto (PartialType)
- [ ] Create UpdateProductDto (PartialType)
- [ ] Create QueryProductsDto (filters, sort, pagination)
- [ ] Create QueryOrdersDto (filters, sort, pagination)

### 3.4 Custom Exceptions
- [ ] Create `src/common/exceptions/business.exception.ts`
- [ ] Create `src/common/exceptions/not-found.exception.ts`
- [ ] Add error codes to all service-layer exceptions
- [ ] Ensure GlobalExceptionFilter maps all exceptions to envelope format

### 3.5 Verification
- [ ] Test: POST /users with empty body → 400 with field errors
- [ ] Test: POST /products with negative price → 400
- [ ] Test: GET /users/nonexistent-uuid → 404 with error code
- [ ] Test: POST /users with duplicate email → 409
- [ ] Test: All responses follow { data } or { error } envelope

---

## Phase 4: Payment System

_(Tasks defined in roadmap.md Phase 4 — will be expanded when Phase 3 is complete)_

- [ ] Create PaymentsModule structure
- [ ] Implement payment initiation with idempotency
- [ ] Implement payment confirmation
- [ ] Implement BullMQ worker with simulation engine
- [ ] Implement event-driven order status updates
- [ ] Implement transaction logging
- [ ] Implement admin payment endpoints
- [ ] Verification tests

---

## Phase 5-9: Future Phases

_(Will be expanded as earlier phases complete. See roadmap.md for overview.)_

---

## How to Use This File

1. **Before starting work:** Find the first `[ ]` task in the current phase
2. **Starting a task:** Change `[ ]` to `[~]`
3. **Completing a task:** Change `[~]` to `[x]`
4. **If blocked:** Change to `[!]` and add a note below the task explaining why
5. **Never skip tasks** — they are ordered by dependency
6. **After completing a phase:** Verify ALL verification tasks pass before moving to next phase
