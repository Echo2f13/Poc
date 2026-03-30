# Observability

> **Purpose:** Logging, metrics, health checks, and error tracking standards. Claude MUST follow these formats when adding any logging or monitoring code.

---

## Logging: nestjs-pino (Pino)

### Why Pino

- Fastest Node.js logger (10x faster than Winston)
- Native JSON output (structured logs)
- Built-in NestJS integration via `nestjs-pino`
- Auto request/response logging via middleware

### Configuration

```
LoggerModule.forRoot({
  pinoHttp: {
    level: configService.get('LOG_LEVEL', 'info'),
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,  // JSON in production
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  },
})
```

### Log Format (Production JSON)

```json
{
  "level": 30,
  "time": 1711234567890,
  "pid": 1,
  "hostname": "app-pod-1",
  "reqId": "req_a1b2c3d4",
  "req": { "method": "POST", "url": "/api/v1/orders" },
  "res": { "statusCode": 201 },
  "responseTime": 142,
  "msg": "request completed"
}
```

### Custom Log Fields

When logging in services, always include context:

```
this.logger.log('Order created', {
  orderId: order.id,
  userId: order.userId,
  total: order.total,
});
```

### Log Levels by Environment

| Environment | Level | Includes |
|-------------|-------|----------|
| development | debug | debug, info, warn, error, fatal |
| test | warn | warn, error, fatal |
| staging | info | info, warn, error, fatal |
| production | warn | warn, error, fatal |

### What to Log

| Event | Level | Fields |
|-------|-------|--------|
| Request completed | info | method, url, statusCode, responseTime |
| User login | info | userId, email (masked), ip |
| User registration | info | userId, email (masked) |
| Order created | info | orderId, userId, total |
| Payment state change | info | paymentId, fromStatus, toStatus, method |
| Payment failed | warn | paymentId, failureReason, retryCount |
| Validation error | warn | path, errors array |
| Auth failure (wrong password) | warn | email (masked), ip |
| Rate limit hit | warn | ip, endpoint |
| Unhandled exception | error | stack trace, requestId |
| Database connection error | error | error message |
| Redis connection error | error | error message |

### What NOT to Log

- Passwords (never, even hashed)
- Full credit card numbers
- JWT tokens
- Refresh tokens
- Cookie values
- User PII beyond what's needed for debugging

### Sensitive Data Redaction

Pino's `redact` option removes:
- `req.headers.authorization`
- `req.headers.cookie`
- Any field matching `*.password*`
- Any field matching `*.token*`
- Any field matching `*.secret*`

---

## Health Checks: @nestjs/terminus

### Endpoints

#### GET /health (Liveness)

Returns 200 if the process is running. No external dependency checks.

```json
{
  "status": "ok",
  "info": {
    "app": { "status": "up" }
  }
}
```

Used by: Docker HEALTHCHECK, load balancer liveness probe.

#### GET /health/ready (Readiness)

Checks external dependencies. Returns 200 only if ALL pass.

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

Used by: Load balancer readiness probe, deploy verification script.

If any check fails:
```json
{
  "status": "error",
  "info": {
    "database": { "status": "up" }
  },
  "error": {
    "redis": { "status": "down", "message": "Connection refused" }
  }
}
```

### Docker HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

---

## Error Tracking: Sentry (Optional, Phase 2)

### When to Add

After core features are stable and deployed to staging. Not needed for local dev.

### Configuration

- Install `@sentry/nestjs`
- Initialize in `main.ts` before app bootstrap
- DSN from `SENTRY_DSN` env var (empty string disables in dev)
- Environment tag from `NODE_ENV`
- Release tag from git commit SHA (set in CI/CD)
- Upload source maps on deploy

### What Gets Captured

- All unhandled exceptions (auto via global filter integration)
- Custom breadcrumbs: payment state changes, order creation
- User context: userId, email, role (set via Sentry.setUser on auth)
- Request context: method, url, requestId

---

## Metrics (Future Phase)

### When to Add

When deploying to production with real traffic. Not needed for MVP.

### Planned Metrics (Prometheus format)

| Metric | Type | Labels |
|--------|------|--------|
| `http_requests_total` | Counter | method, path, status_code |
| `http_request_duration_seconds` | Histogram | method, path |
| `db_query_duration_seconds` | Histogram | operation, entity |
| `payment_attempts_total` | Counter | method, status |
| `payment_processing_duration_seconds` | Histogram | method |
| `queue_jobs_total` | Counter | queue, status |
| `queue_depth` | Gauge | queue |
| `active_sessions` | Gauge | — |

### Dashboard (Grafana)

Planned panels:
- Request rate and latency (p50, p95, p99)
- Error rate by endpoint
- Payment success/failure rates
- Queue depth over time
- Database connection pool usage

---

## Request ID Tracing

### Implementation

Middleware in `src/common/middleware/request-id.middleware.ts`:

1. Check for `X-Request-ID` header (from Nginx/load balancer)
2. If missing, generate UUID v4
3. Attach to request object
4. Set `X-Request-ID` response header
5. Pino automatically includes it in all log entries for this request

### Benefits

- Trace a single request across all log entries
- Correlate frontend errors with backend logs
- Debug distributed issues by searching requestId
