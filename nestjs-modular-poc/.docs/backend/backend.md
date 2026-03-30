# Backend Architecture

> **Purpose:** Backend coding standards, module structure, API conventions. Claude MUST follow these patterns when creating or modifying backend code.

## Framework: NestJS 11.x with TypeScript

## Layered Architecture

```
Request → Middleware → Guard → Interceptor → Pipe → Controller → Service → Repository → Database
```

### Layer Responsibilities

| Layer | Responsibility | Does NOT Do |
|-------|---------------|-------------|
| **Controller** | Parse request params, call service, return response | Business logic, direct DB access |
| **Service** | Business rules, orchestration, transaction management | Request parsing, response formatting |
| **Repository** | Data access, queries, TypeORM operations | Business logic, validation |
| **DTO** | Input shape definition, validation decorators | Business rules |
| **Entity** | Database schema, column definitions, relations | Business logic |

### File Naming Convention

```
src/{module}/
├── {module}.module.ts          # Module definition
├── {module}.controller.ts      # HTTP endpoints
├── {module}.service.ts         # Business logic
├── {module}.repository.ts      # Data access (if custom queries needed)
├── entities/
│   └── {entity}.entity.ts      # TypeORM entity
├── dto/
│   ├── create-{entity}.dto.ts  # Creation input
│   ├── update-{entity}.dto.ts  # Update input (PartialType)
│   └── query-{entity}.dto.ts   # Query/filter params
└── {module}.constants.ts       # Module-specific constants/enums
```

---

## API Conventions

### URL Structure

```
/api/v1/{resource}              # Collection
/api/v1/{resource}/:id          # Single resource
/api/v1/{resource}/:id/{sub}    # Sub-resource
/api/v1/admin/{resource}        # Admin-specific endpoints
```

### HTTP Methods

| Method | Usage | Response Code |
|--------|-------|--------------|
| GET | Read resource(s) | 200 |
| POST | Create resource | 201 |
| PATCH | Partial update | 200 |
| DELETE | Remove resource | 204 (no body) |

### Response Envelope

**Success (single):**
```json
{
  "data": { ... }
}
```

**Success (list):**
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Product X has only 3 items in stock",
    "details": { "productId": "...", "available": 3, "requested": 5 }
  }
}
```

### Pagination

- Query params: `?page=1&limit=20`
- Default limit: 20
- Max limit: 100
- Always return `meta` object on list endpoints

### Filtering

- Query params: `?status=confirmed&minPrice=100&maxPrice=500`
- Whitelist allowed filter fields per endpoint
- Reject unknown filter params (400)

### Sorting

- Query params: `?sort=price&order=asc`
- Whitelist allowed sort fields
- Default: `created_at DESC`

---

## Module Structure

### Standard Module Template

Every feature module follows this pattern:

```
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],  // Only if other modules need it
})
export class FeatureModule {}
```

### Module List

| Module | Route Prefix | Auth Required | Roles |
|--------|-------------|--------------|-------|
| AuthModule | /api/v1/auth | Mixed | Public (login/register), Authenticated (refresh/logout) |
| UsersModule | /api/v1/users | Yes | customer (own profile), admin (all users) |
| ProductsModule | /api/v1/products | Mixed | Public (read), admin (write) |
| CartModule | /api/v1/cart | Yes | customer |
| OrdersModule | /api/v1/orders | Yes | customer (own), admin (all) |
| PaymentsModule | /api/v1/payments | Yes | customer (own), admin (all + override) |
| NotificationsModule | /api/v1/notifications | Yes | customer (own) |
| AdminModule | /api/v1/admin | Yes | admin, super_admin |
| HealthModule | /health | No | Public |

---

## Error Handling

### Global Exception Filter

Registered in `main.ts` via `app.useGlobalFilters(new GlobalExceptionFilter())`.

### Error Code Convention

Format: `DOMAIN_ERROR_TYPE`

| Code | HTTP Status | Description |
|------|------------|-------------|
| VALIDATION_FAILED | 400 | DTO validation errors |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| TOKEN_EXPIRED | 401 | JWT expired |
| TOKEN_INVALID | 401 | JWT malformed or tampered |
| FORBIDDEN | 403 | Insufficient role/permissions |
| NOT_OWNER | 403 | Accessing another user's resource |
| USER_NOT_FOUND | 404 | User doesn't exist |
| PRODUCT_NOT_FOUND | 404 | Product doesn't exist |
| ORDER_NOT_FOUND | 404 | Order doesn't exist |
| EMAIL_EXISTS | 409 | Duplicate email registration |
| INSUFFICIENT_STOCK | 409 | Not enough inventory |
| PAYMENT_ALREADY_PROCESSED | 409 | Duplicate payment attempt |
| INVALID_ORDER_TRANSITION | 422 | Invalid status change |
| INVALID_PAYMENT_TRANSITION | 422 | Invalid payment state change |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

### Custom Exception Classes

```
src/common/exceptions/
├── business.exception.ts       # Base for all business logic errors (422)
├── not-found.exception.ts      # Entity not found (wraps HttpException 404)
├── conflict.exception.ts       # Duplicate/conflict (409)
└── forbidden.exception.ts      # Ownership/permission (403)
```

---

## Validation Rules

### Global ValidationPipe Config

```
{
  whitelist: true,              // Strip unknown properties
  forbidNonWhitelisted: true,   // Error on unknown properties
  transform: true,              // Auto-transform types
  transformOptions: {
    enableImplicitConversion: true
  }
}
```

### DTO Decorator Standards

- Every field MUST have at least `@IsNotEmpty()` or `@IsOptional()`
- Strings: `@IsString()`, `@MinLength()`, `@MaxLength()`
- Emails: `@IsEmail()`
- Numbers: `@IsNumber()`, `@IsPositive()`, `@Min()`, `@Max()`
- UUIDs: `@IsUUID()`
- Enums: `@IsEnum(EnumType)`
- Arrays: `@IsArray()`, `@ValidateNested({ each: true })`, `@Type(() => ItemDto)`
- Update DTOs: extend `PartialType(CreateDto)`

---

## Dependencies to Install

### Production

```
@nestjs/config
@nestjs/jwt
@nestjs/passport
passport
passport-jwt
@nestjs/typeorm
typeorm
pg
class-validator
class-transformer
@nestjs/throttler
@nestjs/bullmq
bullmq
ioredis
helmet
bcrypt
uuid
nestjs-pino
pino-http
@nestjs/terminus
```

### Development

```
@types/passport-jwt
@types/bcrypt
```

---

## Environment Variables

Validated on startup via `@nestjs/config` with Joi schema. App fails fast if required vars are missing.

| Variable | Required | Default (dev) | Description |
|----------|----------|---------------|-------------|
| PORT | No | 3000 | Server port |
| NODE_ENV | No | development | Environment |
| DATABASE_URL | Yes | — | PostgreSQL connection string |
| JWT_SECRET | Yes | — | JWT signing secret |
| JWT_EXPIRY | No | 15m | Access token expiry |
| JWT_REFRESH_EXPIRY | No | 7d | Refresh token expiry |
| REDIS_URL | Yes | — | Redis connection string |
| CORS_ORIGINS | No | * | Allowed origins (comma-separated) |
| LOG_LEVEL | No | debug | Pino log level |
| PAYMENT_CARD_SUCCESS_RATE | No | 80 | Card payment success % |
| PAYMENT_UPI_SUCCESS_RATE | No | 90 | UPI payment success % |
| PAYMENT_MIN_DELAY_MS | No | 2000 | Min processing delay |
| PAYMENT_MAX_DELAY_MS | No | 5000 | Max processing delay |
