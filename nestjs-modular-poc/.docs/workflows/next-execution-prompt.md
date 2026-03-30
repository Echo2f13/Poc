# Next Execution Prompt

> **Purpose:** Copy-paste this prompt into a new Claude Code session to begin Phase 1 implementation.

---

## PROMPT: Phase 1 — Database & Persistence

```
Read the .docs/ engineering system in this project before doing anything:

1. Read .docs/tracking/tasks.md — find Phase 1 tasks
2. Read .docs/tracking/progress.md — confirm we're starting Phase 1
3. Read .docs/tracking/feedback-loop.md — check for any known gotchas
4. Read .docs/database/db.md — full schema reference
5. Read .docs/architecture/architecture.md — module map and directory structure
6. Read .docs/backend/backend.md — coding conventions and env var requirements
7. Read .docs/workflows/claude-interaction-model.md — how to operate

Now implement Phase 1 (Database & Persistence) by following tasks.md in strict order:

STEP 1: Dependencies & Config
- Install: @nestjs/config, @nestjs/typeorm, typeorm, pg, joi
- Create .env.example with all variables from backend.md
- Create .env.development with local PostgreSQL connection (localhost:5432, db: app_dev, user: dev, password: dev)
- Configure ConfigModule.forRoot() with Joi validation in app.module.ts
- Configure TypeOrmModule.forRootAsync() using ConfigService
- Verify the app fails fast if DATABASE_URL is missing

STEP 2: Docker Setup
- Create docker-compose.yml with postgres:16-alpine and redis:7-alpine
- Add adminer for dev DB access
- Add persistent volume for PostgreSQL data
- Test: docker-compose up starts services

STEP 3: Entities
- Create ALL entities defined in .docs/database/db.md
- Follow the exact column types, constraints, and relationships
- Use UUID primary keys with @PrimaryGeneratedColumn('uuid')
- Use proper TypeORM decorators: @Column, @ManyToOne, @OneToMany, @JoinColumn
- Create enums in src/common/types/enums.ts

STEP 4: Migration
- Configure TypeORM CLI (typeorm.config.ts as DataSource)
- Add migration scripts to package.json
- Generate initial migration from entities
- Run migration and verify all tables are created

STEP 5: Seed Data
- Create seeds/dev.seed.ts with realistic data (50 users, categories, 200 products, 500 orders)
- Passwords should be bcrypt hashed (use a default like "password123")
- Add npm run seed:dev script

STEP 6: Refactor Services
- Replace in-memory arrays in UsersService with TypeORM repository
- Replace in-memory arrays in ProductsService with TypeORM repository
- Replace in-memory arrays in OrdersService with TypeORM repository
- Remove all hardcoded seed data from service constructors
- Use TypeORM relations for order enrichment (joins) instead of manual lookup

STEP 7: Pagination
- Create src/common/dto/pagination.dto.ts
- Add pagination to GET /users, GET /products, GET /orders
- Return { data, meta: { page, limit, total, totalPages } }

After EACH completed task:
- Update .docs/tracking/tasks.md (mark [x])
- Update .docs/tracking/progress.md (update percentage)
- If anything unexpected happens, log in .docs/tracking/feedback-loop.md

VERIFICATION before moving to Phase 2:
- Server connects to PostgreSQL on startup
- Data persists across server restarts
- GET /users returns paginated response from database
- POST /users creates user in database
- GET /products returns paginated response
- GET /orders returns orders with joined user/product data
- docker-compose up starts all services
```

---

## PROMPT: Phase 2 — Authentication & Authorization

_(Use after Phase 1 is 100% complete)_

```
Read .docs/ engineering system:
1. .docs/tracking/tasks.md — find Phase 2 tasks
2. .docs/tracking/progress.md — confirm Phase 1 is 100%
3. .docs/security/security.md — auth architecture
4. .docs/security/auth-flow.md — detailed flow sequences
5. .docs/backend/backend.md — coding conventions
6. .docs/workflows/claude-interaction-model.md — operating rules

Implement Phase 2 (Authentication & Authorization) following tasks.md strictly.

Key requirements:
- JWT access token (15 min) + refresh token in httpOnly cookie (7 days)
- bcrypt with 12 salt rounds for passwords
- JwtAuthGuard applied globally, @Public() for public routes
- RolesGuard with @Roles() decorator
- @CurrentUser() param decorator
- Helmet middleware, CORS with credentials, @nestjs/throttler rate limiting
- Session tracking in sessions table

Follow .docs/security/auth-flow.md for exact registration, login, refresh, and logout sequences.
Update docs after each task.
```

---

## PROMPT: Phase 3 — Validation & Error Handling

_(Use after Phase 2 is 100% complete)_

```
Read .docs/:
1. .docs/tracking/tasks.md — find Phase 3 tasks
2. .docs/backend/error-handling.md — exception strategy, error codes
3. .docs/backend/api-contracts.md — response formats
4. .docs/backend/backend.md — DTO validation standards

Implement Phase 3 (Validation & Error Handling) following tasks.md strictly.

Key requirements:
- Global ValidationPipe with whitelist + forbidNonWhitelisted + transform
- class-validator decorators on ALL DTOs (see backend.md for rules per field type)
- GlobalExceptionFilter mapping all errors to { error: { code, message, details } }
- TransformInterceptor wrapping all responses in { data } or { data, meta }
- Custom exception classes per error-handling.md
- Proper HTTP status codes on all controllers

Update docs after each task.
```

---

## PROMPT: Phase 4 — Payment System

_(Use after Phase 3 is 100% complete)_

```
Read .docs/:
1. .docs/tracking/tasks.md — find Phase 4 tasks
2. .docs/payments/payments.md — COMPLETE payment specification
3. .docs/backend/queue-system.md — BullMQ setup
4. .docs/backend/api-contracts.md — payment endpoint contracts
5. .docs/architecture/architecture.md — event flow

Implement Phase 4 (Payment System) following tasks.md strictly.

Key requirements:
- Payment state machine with strict valid transitions (see payments.md)
- Idempotency via Idempotency-Key header
- BullMQ queue for async payment processing
- Simulation engine with configurable success rates
- Transaction logging (immutable, every state change)
- Event emission: PaymentSucceeded, PaymentFailed
- Event handlers: update order status, decrement stock, create notification
- Admin endpoints: list payments, override status

Follow .docs/payments/payments.md exactly — it is the complete specification.
Update docs after each task.
```
