# Security Architecture

> **Purpose:** Authentication, authorization, and security standards. Claude MUST follow these patterns for all auth-related code.

---

## Authentication: JWT + Refresh Token

### Token Strategy

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| Access Token | Client memory (JS variable) | 15 minutes | API authorization via Bearer header |
| Refresh Token | httpOnly cookie (SameSite=Strict) | 7 days | Silent token renewal |

### Why NOT localStorage for tokens

- localStorage is accessible to any JS on the page (XSS vulnerable)
- httpOnly cookies are invisible to JS — immune to XSS token theft
- Access token in memory is lost on page refresh — refresh endpoint restores it

### Auth Flow

See [auth-flow.md](auth-flow.md) for detailed sequence diagrams.

**Registration:**
```
POST /api/v1/auth/register { name, email, password }
  → Validate input (email format, password min 8 chars)
  → Check email not already registered
  → Hash password with bcrypt (12 rounds)
  → Create user record (role: customer, email_verified: false)
  → Generate access + refresh tokens
  → Set refresh token in httpOnly cookie
  → Create session record
  → Return { accessToken, user: { id, name, email, role } }
```

**Login:**
```
POST /api/v1/auth/login { email, password }
  → Find user by email (case-insensitive, lowercase normalized)
  → Verify user.is_active === true
  → bcrypt.compare(password, user.password_hash)
  → Generate access + refresh tokens
  → Set refresh token in httpOnly cookie
  → Create session record
  → Log audit: LOGIN action
  → Return { accessToken, user: { id, name, email, role } }
```

**Token Refresh:**
```
POST /api/v1/auth/refresh (cookie sent automatically)
  → Extract refresh token from httpOnly cookie
  → Validate token signature and expiry
  → Find session by token hash
  → Verify session not expired
  → Generate NEW access + refresh tokens (rotation)
  → Update session with new refresh token hash
  → Set new refresh token in httpOnly cookie
  → Return { accessToken }
```

**Logout:**
```
POST /api/v1/auth/logout
  → Extract refresh token from cookie
  → Delete session record from DB
  → Clear httpOnly cookie
  → Log audit: LOGOUT action
  → Return 204
```

### JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1711234567,
  "exp": 1711235467
}
```

### Password Rules

- Minimum 8 characters
- No maximum (bcrypt handles any length via hashing)
- Hashed with bcrypt, 12 salt rounds
- Never stored in plaintext, never logged, never returned in any API response

---

## Authorization: RBAC

### Role Hierarchy

```
super_admin
    ↓ (inherits all admin permissions)
  admin
    ↓ (inherits all customer permissions)
  customer
```

### Permission Matrix

| Resource | Action | customer | admin | super_admin |
|----------|--------|----------|-------|-------------|
| Products | Read (list/detail) | Yes (public) | Yes | Yes |
| Products | Create/Update/Delete | No | Yes | Yes |
| Cart | CRUD own cart | Yes | Yes | Yes |
| Orders | Read own orders | Yes | Yes | Yes |
| Orders | Read all orders | No | Yes | Yes |
| Orders | Update status | No | Yes | Yes |
| Payments | Initiate/confirm own | Yes | Yes | Yes |
| Payments | View all payments | No | Yes | Yes |
| Payments | Refund | No | Yes | Yes |
| Payments | Override (force status) | No | No | Yes |
| Users | Read own profile | Yes | Yes | Yes |
| Users | Update own profile | Yes | Yes | Yes |
| Users | Read all users | No | Yes | Yes |
| Users | Deactivate users | No | Yes | Yes |
| Users | Assign roles | No | No | Yes |
| Users | Delete users | No | No | Yes |
| Audit Logs | Read | No | Yes | Yes |
| Feature Flags | Read | No | Yes | Yes |
| Feature Flags | Update | No | No | Yes |
| Notifications | Read own | Yes | Yes | Yes |
| Sessions | Read own | Yes | Yes | Yes |
| Sessions | Revoke own | Yes | Yes | Yes |
| Sessions | Revoke any user | No | Yes | Yes |

### Implementation

**Guard chain:** `JwtAuthGuard` → `RolesGuard`

```
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('all-users')
findAllUsers() { ... }
```

**Public routes** (no auth required):
- `@Public()` decorator skips JwtAuthGuard
- Applied to: GET /products, GET /products/:id, POST /auth/login, POST /auth/register, GET /health

**Ownership enforcement:**
- Service layer checks `resource.userId === currentUser.id`
- Not a guard — done in service because it requires DB lookup
- Pattern: `if (order.userId !== userId) throw new ForbiddenException('NOT_OWNER')`

---

## Input Validation

### Global ValidationPipe

Registered in `main.ts`:
```
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}));
```

### Validation Rules by Domain

| Field | Rule | DTO Decorator |
|-------|------|---------------|
| email | Valid email format, lowercase | @IsEmail(), @Transform(toLowerCase) |
| password | Min 8 chars | @IsString(), @MinLength(8) |
| name | 2-100 chars | @IsString(), @MinLength(2), @MaxLength(100) |
| price | Positive decimal | @IsNumber(), @IsPositive() |
| stock | Non-negative integer | @IsInt(), @Min(0) |
| quantity | Positive integer | @IsInt(), @IsPositive() |
| UUID fields | Valid UUID v4 | @IsUUID() |
| rating | 1-5 integer | @IsInt(), @Min(1), @Max(5) |
| page | Positive integer | @IsInt(), @IsPositive(), @IsOptional() |
| limit | 1-100 integer | @IsInt(), @Min(1), @Max(100), @IsOptional() |

---

## Security Headers (Helmet)

Registered in `main.ts` via `app.use(helmet())`.

Headers set:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (deprecated, CSP is better)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)
- `Content-Security-Policy: default-src 'self'` (adjusted for frontend needs)
- `Referrer-Policy: strict-origin-when-cross-origin`

## CORS

```
app.enableCors({
  origin: configService.get('CORS_ORIGINS').split(','),
  credentials: true,  // Required for httpOnly cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
});
```

## Rate Limiting

Using `@nestjs/throttler`:

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| Global default | 100 req | 60 seconds | General abuse prevention |
| POST /auth/login | 5 req | 60 seconds | Brute force prevention |
| POST /auth/register | 3 req | 60 seconds | Spam account prevention |
| POST /payments/*/confirm | 5 req | 60 seconds | Payment abuse prevention |

## Secrets Management

| Secret | Dev | Staging/Prod |
|--------|-----|-------------|
| JWT_SECRET | `.env.development` (gitignored) | CI/CD secret / Vault |
| DATABASE_URL | `.env.development` | CI/CD secret |
| REDIS_URL | `.env.development` | CI/CD secret |
| ADMIN_SEED_PASSWORD | `.env.development` | CI/CD secret |

**Rules:**
- NEVER commit `.env` files (only `.env.example` with placeholder values)
- NEVER log secrets
- NEVER return secrets in API responses
- Rotate JWT_SECRET periodically — existing tokens invalidated on rotation

## OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|-----------|
| A01 Broken Access Control | JWT guards + RBAC + ownership checks |
| A02 Cryptographic Failures | bcrypt hashing, httpOnly cookies, no plaintext secrets |
| A03 Injection | Parameterized queries via TypeORM, no raw SQL, ValidationPipe |
| A04 Insecure Design | State machine for payments, validation at every boundary |
| A05 Security Misconfiguration | Helmet, CORS whitelist, env validation on startup |
| A06 Vulnerable Components | npm audit in CI, Snyk scanning |
| A07 Auth Failures | Rate limiting on login, bcrypt, token rotation |
| A08 Data Integrity | Immutable audit logs, transaction logging |
| A09 Logging Failures | Structured logging with request IDs, audit trail |
| A10 SSRF | No user-controlled URLs fetched server-side |
