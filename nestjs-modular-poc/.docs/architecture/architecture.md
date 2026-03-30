# System Architecture

> **Purpose:** Single source of truth for the entire system design. Claude MUST read this before any implementation work.

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | NestJS | 11.x |
| Language | TypeScript | 5.7+ |
| Database | PostgreSQL | 16 |
| ORM | TypeORM | 0.3.x |
| Cache | Redis | 7 |
| Queue | BullMQ | 5.x |
| Frontend | React + TypeScript | 18.x + 5.x |
| Build Tool | Vite | 6.x |
| Reverse Proxy | Nginx | latest |
| Container | Docker + Docker Compose | latest |

## High-Level Architecture

```
[Browser / React SPA]
        │
        ▼
    [Nginx] ── SSL termination, gzip, rate limiting, static assets
        │
        ▼
  [NestJS App] ── REST API, business logic, auth
    │       │
    ▼       ▼
[PostgreSQL] [Redis]
              │
              ▼
          [BullMQ Queues]
```

## Module Map

```
AppModule
├── ConfigModule (global)
├── DatabaseModule (TypeORM)
├── RedisModule (cache + queues)
├── AuthModule
│   ├── JwtStrategy
│   ├── JwtAuthGuard
│   ├── RolesGuard
│   └── SessionService
├── UsersModule
│   ├── UsersController
│   ├── UsersService
│   └── UsersRepository (TypeORM)
├── ProductsModule
│   ├── ProductsController
│   ├── ProductsService
│   ├── ProductsRepository
│   └── CategoriesService
├── CartModule
│   ├── CartController
│   ├── CartService
│   └── CartRepository
├── OrdersModule
│   ├── OrdersController
│   ├── OrdersService
│   └── OrdersRepository
├── PaymentsModule
│   ├── PaymentsController
│   ├── PaymentsService
│   ├── PaymentProcessorService (mock gateway)
│   ├── TransactionsRepository
│   └── PaymentQueue (BullMQ)
├── NotificationsModule
│   ├── NotificationsController
│   ├── NotificationsService
│   └── EmailSimulatorService
├── AdminModule
│   ├── AdminController
│   ├── AdminService
│   └── AnalyticsService
├── AuditModule
│   ├── AuditInterceptor
│   ├── AuditService
│   └── AuditRepository
└── HealthModule
    └── HealthController
```

## Data Flow: Order Placement

```
1. Client → POST /api/v1/cart/checkout
2. CartService.checkout()
   → Validate cart items exist and have stock
   → Calculate subtotal, tax, total
   → Create Order (status: pending)
   → Create OrderItems (snapshot prices)
   → Clear cart
   → Return orderId

3. Client → POST /api/v1/payments/initiate { orderId, idempotencyKey }
4. PaymentsService.initiate()
   → Validate order exists, belongs to user, status is pending
   → Check idempotency key (return existing if duplicate)
   → Create Payment (status: initiated)
   → Return paymentId

5. Client → POST /api/v1/payments/:id/confirm { method, details }
6. PaymentsService.confirm()
   → Validate payment is in initiated/failed state
   → Store payment method details
   → Update payment status to pending
   → Enqueue payment-processing job (BullMQ)
   → Return { status: pending }

7. BullMQ Worker picks up job
   → PaymentProcessorService.process()
   → Simulate delay (2-5s)
   → Roll success/failure based on config rates
   → Update payment status (success/failed)
   → Log transaction record
   → Emit PaymentSucceeded/PaymentFailed event

8. Event Handlers:
   → PaymentSucceeded → Order status → confirmed, decrement stock, create notification
   → PaymentFailed → Order status → payment_failed, create notification
```

## Request Lifecycle

```
Request
  → Nginx (rate limit, SSL, compression)
  → NestJS Middleware (request ID, logging)
  → Guard (JwtAuthGuard → RolesGuard)
  → Interceptor (AuditInterceptor, TransformInterceptor)
  → Pipe (ValidationPipe)
  → Controller
  → Service (business logic)
  → Repository (TypeORM)
  → Database
  → Response transformed by interceptor
  → Logged by middleware
```

## Directory Structure (Target)

```
nestjs-modular-poc/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/        # @CurrentUser, @Roles, @Public
│   │   ├── guards/            # JwtAuthGuard, RolesGuard, OwnershipGuard
│   │   ├── interceptors/      # AuditInterceptor, TransformInterceptor, LoggingInterceptor
│   │   ├── filters/           # GlobalExceptionFilter
│   │   ├── pipes/             # (ValidationPipe configured globally)
│   │   ├── middleware/        # RequestIdMiddleware, LoggerMiddleware
│   │   ├── dto/               # PaginationDto, ApiResponseDto
│   │   └── types/             # Role enum, OrderStatus enum, PaymentStatus enum
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── cart/
│   ├── orders/
│   ├── payments/
│   ├── notifications/
│   ├── admin/
│   ├── audit/
│   └── health/
├── frontend/                  # React app (separate build)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── migrations/                # TypeORM migrations
├── seeds/                     # Development seed data
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── docker-compose.yml
├── .docs/                     # Engineering system (this folder)
├── .env.example
├── .env.development
├── .env.test
├── package.json
└── tsconfig.json
```

## Cross-Module Dependencies

| Module | Depends On |
|--------|-----------|
| AuthModule | UsersModule, ConfigModule |
| CartModule | ProductsModule, AuthModule |
| OrdersModule | CartModule, UsersModule, ProductsModule, PaymentsModule |
| PaymentsModule | OrdersModule (circular — use forwardRef), ConfigModule |
| NotificationsModule | UsersModule |
| AdminModule | UsersModule, ProductsModule, OrdersModule, PaymentsModule, AuditModule |
| AuditModule | None (receives events, standalone) |

## Key Architectural Decisions

See [decisions.md](../decisions/decisions.md) for full rationale.

- **Monolith-first:** Single NestJS app, not microservices. Extract later if needed.
- **TypeORM over Prisma:** Better NestJS integration, decorator-based entities match NestJS style.
- **BullMQ for async:** Payment processing must be async to simulate real gateway behavior.
- **Feature-based modules:** Each domain is a self-contained NestJS module.
- **Frontend separate build:** React app in `/frontend`, built by Vite, served by Nginx (not NestJS ServeStatic in production).
