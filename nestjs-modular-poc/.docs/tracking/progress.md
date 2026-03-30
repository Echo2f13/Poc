# Progress Tracker

> **Purpose:** High-level status of what's done, in-progress, and blocked. Claude MUST update this after completing any task or phase.

---

## Overall Status

| Phase | Name | Status | Completion |
|-------|------|--------|-----------|
| 0 | Foundation (Existing POC) | DONE | 100% |
| 1 | Database & Persistence | IN PROGRESS | 85% |
| 2 | Authentication & Authorization | NOT STARTED | 0% |
| 3 | Validation & Error Handling | NOT STARTED | 0% |
| 4 | Payment System | NOT STARTED | 0% |
| 5 | Cart & Checkout | NOT STARTED | 0% |
| 6 | Admin & Audit | NOT STARTED | 0% |
| 7 | Notifications & Observability | NOT STARTED | 0% |
| 8 | Frontend Migration (React) | NOT STARTED | 0% |
| 9 | DevOps & Production | NOT STARTED | 0% |

**Current Phase:** 2 (Authentication & Authorization)
**Current Task:** 2.1 — Install auth dependencies
**Last Updated:** 2026-03-30

---

## Completed Items

### Phase 0: Foundation
- [x] NestJS project scaffold
- [x] Users module (controller, service, DTO, in-memory)
- [x] Products module (controller, service, DTO, in-memory)
- [x] Orders module (controller, service, DTO, in-memory, cross-module injection)
- [x] ServeStaticModule for frontend
- [x] Vanilla frontend: login, products, orders, payment, admin pages
- [x] Frontend: toast notifications, product icons, PDF invoice
- [x] ESLint + Prettier configured

### Phase 1: Database & Persistence (85% — remaining: seed data, cart/payment entities, migration file)
- [x] Installed @nestjs/config, @nestjs/typeorm, typeorm, pg, joi
- [x] Created .env.example and .env.development
- [x] .gitignore updated for .env.* files
- [x] ConfigModule with Joi validation schema (fail-fast on missing DB vars)
- [x] TypeOrmModule.forRootAsync using ConfigService
- [x] docker-compose.yml: postgres:16-alpine, redis:7-alpine, adminer
- [x] All core entities created with TypeORM decorators:
  - users (UUID PK, role enum, soft delete)
  - addresses (FK to users, cascade delete)
  - categories (self-referential parent_id)
  - products (FK to categories, soft delete)
  - reviews (unique composite: user_id + product_id)
  - orders (status enum, FK to users + addresses)
  - order_items (FK to orders + products)
  - sessions (FK to users, for auth Phase 2)
- [x] All 4 modules refactored from in-memory to TypeORM repositories
  - UsersService: findAll (paginated), findOne, findByEmail, create
  - ProductsService: findAll (paginated, isActive filter), findOne, create
  - OrdersService: findAll (paginated, with relations), findOne, create
  - ReviewsService: findAll (paginated, by productId), findOne, create
- [x] All controllers return { data, meta } paginated envelope
- [x] typeorm.config.ts DataSource for CLI migrations
- [x] App verified: starts successfully, all 7 tables auto-created by synchronize:true
- [x] Nikhil's ReviewsModule integrated (replaced plain class with TypeORM entity)

---

## In Progress

_(Phase 2 starting next)_

---

## Blocked Items

- **1.4 Migration file**: synchronize:true active in dev. Need to set synchronize:false and generate proper migration before staging/production deployment.

---

## Known Issues

1. **synchronize:true in app.module.ts**: Must be changed to `false` and a migration generated before any staging/production deploy. Tracked in 1.4.
2. **No authentication**: Any user can access any endpoint. Resolved by Phase 2.
3. **No input validation**: API accepts any JSON body. Resolved by Phase 3.
4. **Cart/Payment/Notification/Audit/FeatureFlag entities**: Not yet created. Needed for Phase 4-6.

---

## Update Log

| Date | Phase | What Changed |
|------|-------|-------------|
| 2026-03-25 | 0 | Initial audit complete. .docs/ system created. |
| 2026-03-30 | 1 | Phase 1 core complete: TypeORM entities, repos, pagination, docker-compose, ConfigModule |
