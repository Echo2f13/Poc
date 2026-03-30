# Authentication Flow — Detailed Sequences

> **Purpose:** Step-by-step auth flows for implementation reference. Claude MUST follow these exact sequences.

---

## Registration Flow

```
CLIENT                          SERVER                          DATABASE
  │                               │                               │
  ├── POST /auth/register ───────►│                               │
  │   { name, email, password }   │                               │
  │                               ├── Validate DTO ──────────────►│
  │                               │   (class-validator)           │
  │                               │                               │
  │                               ├── Check email exists ────────►│
  │                               │                               ├── SELECT WHERE email
  │                               │◄──────────────────────────────┤  (case-insensitive)
  │                               │                               │
  │                               │   If exists → 409 EMAIL_EXISTS│
  │                               │                               │
  │                               ├── Hash password ──────────────│
  │                               │   bcrypt(password, 12 rounds) │
  │                               │                               │
  │                               ├── Create user ────────────────►│
  │                               │                               ├── INSERT users
  │                               │◄──────────────────────────────┤  (role: customer)
  │                               │                               │
  │                               ├── Generate access token ──────│
  │                               │   JWT { sub, email, role }    │
  │                               │   Expires: 15 min             │
  │                               │                               │
  │                               ├── Generate refresh token ─────│
  │                               │   JWT { sub, jti }            │
  │                               │   Expires: 7 days             │
  │                               │                               │
  │                               ├── Create session ─────────────►│
  │                               │                               ├── INSERT sessions
  │                               │◄──────────────────────────────┤  (token_hash, ip, ua)
  │                               │                               │
  │◄── 201 + Set-Cookie ─────────┤                               │
  │   Body: { accessToken, user } │                               │
  │   Cookie: refreshToken=...    │                               │
```

---

## Login Flow

```
CLIENT                          SERVER                          DATABASE
  │                               │                               │
  ├── POST /auth/login ──────────►│                               │
  │   { email, password }         │                               │
  │                               ├── Rate limit check ──────────►│ (Throttler: 5/min)
  │                               │                               │
  │                               ├── Find user by email ────────►│
  │                               │                               ├── SELECT WHERE email
  │                               │◄──────────────────────────────┤
  │                               │                               │
  │                               │   If not found → 401          │
  │                               │   If not active → 403         │
  │                               │                               │
  │                               ├── Compare password ───────────│
  │                               │   bcrypt.compare()            │
  │                               │                               │
  │                               │   If mismatch → 401           │
  │                               │   (same error as not found)   │
  │                               │                               │
  │                               ├── Generate tokens ────────────│
  │                               ├── Create session ─────────────►│
  │                               ├── Log audit: LOGIN ───────────►│
  │                               │                               │
  │◄── 200 + Set-Cookie ─────────┤                               │
```

**Security note:** Login returns the same 401 error whether email doesn't exist or password is wrong. This prevents email enumeration.

---

## Token Refresh Flow

```
CLIENT                          SERVER                          DATABASE
  │                               │                               │
  ├── POST /auth/refresh ────────►│                               │
  │   (Cookie: refreshToken=...)  │                               │
  │                               │                               │
  │                               ├── Extract token from cookie ──│
  │                               │                               │
  │                               │   If no cookie → 401          │
  │                               │                               │
  │                               ├── Verify JWT signature ───────│
  │                               │                               │
  │                               │   If invalid/expired → 401    │
  │                               │                               │
  │                               ├── Find session by hash ──────►│
  │                               │                               ├── SELECT sessions
  │                               │◄──────────────────────────────┤  WHERE token_hash
  │                               │                               │
  │                               │   If no session → 401         │
  │                               │   (token was revoked)         │
  │                               │                               │
  │                               ├── Delete old session ────────►│
  │                               │                               ├── DELETE sessions
  │                               │                               │
  │                               ├── Generate new tokens ────────│
  │                               ├── Create new session ────────►│
  │                               │                               ├── INSERT sessions
  │                               │                               │
  │◄── 200 + Set-Cookie ─────────┤                               │
  │   Body: { accessToken }       │                               │
  │   Cookie: new refreshToken    │                               │
```

**Token rotation:** The old refresh token is invalidated BEFORE the new one is created. This means a stolen refresh token can only be used once — the legitimate user's next refresh will fail, alerting them to the compromise.

---

## Authenticated Request Flow

```
CLIENT                          SERVER
  │                               │
  ├── GET /api/v1/orders ────────►│
  │   Authorization: Bearer JWT   │
  │                               ├── JwtAuthGuard
  │                               │   1. Extract token from header
  │                               │   2. Verify signature + expiry
  │                               │   3. Decode payload { sub, email, role }
  │                               │   4. Attach to request.user
  │                               │
  │                               ├── RolesGuard (if @Roles applied)
  │                               │   1. Read @Roles metadata
  │                               │   2. Check request.user.role
  │                               │   3. If insufficient → 403
  │                               │
  │                               ├── Controller handler
  │                               │   Access user via @CurrentUser()
  │                               │
  │◄── 200 ──────────────────────┤
```

---

## Logout Flow

```
CLIENT                          SERVER                          DATABASE
  │                               │                               │
  ├── POST /auth/logout ─────────►│                               │
  │   Authorization: Bearer JWT   │                               │
  │   (Cookie: refreshToken=...)  │                               │
  │                               │                               │
  │                               ├── Extract refresh token ──────│
  │                               ├── Hash token ─────────────────│
  │                               ├── Delete session ─────────────►│
  │                               │                               ├── DELETE sessions
  │                               │                               │  WHERE token_hash
  │                               ├── Log audit: LOGOUT ──────────►│
  │                               │                               │
  │◄── 204 + Clear-Cookie ───────┤                               │
  │   Set-Cookie: refreshToken=;  │                               │
  │   Max-Age=0                   │                               │
```

---

## Frontend Auth State Management

```
Page Load
  │
  ├── Check: accessToken in memory?
  │   ├── Yes → Use it for API calls
  │   └── No → Call POST /auth/refresh
  │       ├── Success → Store new accessToken in memory
  │       └── Failure (401) → Redirect to /login
  │
API Call
  │
  ├── Attach Authorization header from memory
  ├── Response 401?
  │   ├── Call POST /auth/refresh
  │   │   ├── Success → Retry original request with new token
  │   │   └── Failure → Clear auth state, redirect to /login
  │   └── (Use a flag to prevent infinite refresh loops)
  └── Response OK → Return data
```

**Implementation:** Axios interceptor handles 401 → refresh → retry automatically. A `isRefreshing` flag prevents multiple concurrent refresh calls.

---

## Cookie Configuration

```
Name: refreshToken
Value: <JWT>
HttpOnly: true          ← Cannot be read by JavaScript
Secure: true            ← Only sent over HTTPS (disable in dev)
SameSite: Strict        ← Not sent on cross-site requests
Path: /api/v1/auth      ← Only sent to auth endpoints
Max-Age: 604800         ← 7 days in seconds
```
