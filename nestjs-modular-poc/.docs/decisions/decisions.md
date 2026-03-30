# Architectural Decision Records

> **Purpose:** Log every significant technical decision with rationale and tradeoffs. Claude MUST add an entry here when making or changing an architectural choice. Future sessions can reference these to understand WHY things were done a certain way.

---

## Format

```
## ADR-[NUMBER]: [Title]

**Date:** YYYY-MM-DD
**Status:** Accepted / Superseded by ADR-X / Deprecated
**Context:** Why this decision was needed
**Decision:** What was decided
**Alternatives considered:** What else was evaluated
**Tradeoffs:** What we gain and what we lose
**Consequences:** What changes as a result
```

---

## ADR-001: Monolith-First Architecture

**Date:** 2026-03-25
**Status:** Accepted

**Context:** The project needs to evolve from a POC to a production-grade SaaS. We need to decide between microservices and monolith.

**Decision:** Keep everything in a single NestJS application. All modules (auth, payments, orders, etc.) live in the same process.

**Alternatives considered:**
- Microservices: separate services for payments, orders, auth
- Modular monolith with separate databases per module

**Tradeoffs:**
- Gain: Simpler deployment, no inter-service communication overhead, easier debugging, single database
- Lose: Modules are coupled at deploy time, can't scale independently

**Consequences:** All modules share one PostgreSQL database. If we need to extract a service later (e.g., payments), we'll need to introduce an API gateway and message broker.

---

## ADR-002: TypeORM over Prisma

**Date:** 2026-03-25
**Status:** Accepted

**Context:** Need an ORM for PostgreSQL. The two main options in the NestJS ecosystem are TypeORM and Prisma.

**Decision:** Use TypeORM 0.3.x with the DataSource API.

**Alternatives considered:**
- Prisma: Better type safety, auto-generated client, but requires separate schema file
- Drizzle: Lightweight but less mature NestJS integration
- Raw SQL with pg: Maximum control but no migration system

**Tradeoffs:**
- Gain: Decorator-based entities match NestJS style, first-class NestJS support via @nestjs/typeorm, built-in migration system
- Lose: TypeORM's type inference is weaker than Prisma's, some edge cases in migration generation

**Consequences:** Entities are defined as decorated classes in `src/{module}/entities/`. Migrations managed via TypeORM CLI.

---

## ADR-003: JWT in Memory + Refresh in httpOnly Cookie

**Date:** 2026-03-25
**Status:** Accepted

**Context:** Need to store auth tokens on the client. Options: localStorage, sessionStorage, httpOnly cookies, or in-memory.

**Decision:** Access token stored in JavaScript memory (variable). Refresh token stored in httpOnly, SameSite=Strict cookie.

**Alternatives considered:**
- Both tokens in localStorage: vulnerable to XSS
- Both tokens in httpOnly cookies: requires CSRF protection, larger cookie size
- Session-based auth (no JWT): requires sticky sessions or shared session store

**Tradeoffs:**
- Gain: Access token immune to XSS (not in storage), refresh token immune to XSS (httpOnly), no CSRF risk (SameSite=Strict)
- Lose: Access token lost on page refresh (requires silent refresh call), more complex client-side auth logic

**Consequences:** Frontend must call `/auth/refresh` on page load to restore access token. TanStack Query's `onError` handler must detect 401 and trigger refresh.

---

## ADR-004: BullMQ for Payment Processing

**Date:** 2026-03-25
**Status:** Accepted

**Context:** Payment processing must be async to simulate real gateway behavior (2-5 second delays). Need a queue system.

**Decision:** Use BullMQ with Redis as the backing store.

**Alternatives considered:**
- setTimeout in service: Simple but blocks Node.js event loop, lost on restart
- NestJS CQRS: Overkill for this use case
- RabbitMQ: More powerful but adds operational complexity

**Tradeoffs:**
- Gain: Persistent jobs (survive restart), built-in retry logic, NestJS integration via @nestjs/bullmq, Redis already needed for caching
- Lose: Adds Redis dependency (acceptable — already using it for caching)

**Consequences:** Redis is a required infrastructure dependency. docker-compose must include Redis. Payment results are delivered via event emitter after queue processing.

---

## ADR-005: React + Vite for Frontend Migration

**Date:** 2026-03-25
**Status:** Accepted

**Context:** Current vanilla HTML/JS frontend cannot scale. Need a component framework.

**Decision:** Migrate to React 18 + TypeScript with Vite as the build tool. Frontend lives in `/frontend` directory with its own package.json.

**Alternatives considered:**
- Next.js: SSR/SSG overkill for an authenticated SaaS app
- Vue 3: Good but team has more React experience
- Keep vanilla JS: Not viable for 20+ features
- Angular: Too heavy, slower development velocity

**Tradeoffs:**
- Gain: Component reusability, TypeScript safety, massive ecosystem, Vite's fast HMR
- Lose: Separate build process, more complex project structure, learning curve for current vanilla JS

**Consequences:** Backend serves API only (no ServeStaticModule in production). Nginx serves frontend static files and proxies API requests. Development uses Vite dev server with proxy to NestJS.

---

## ADR-006: Separate Frontend Build (Not NestJS ServeStatic)

**Date:** 2026-03-25
**Status:** Accepted

**Context:** Currently using `@nestjs/serve-static` to serve HTML files from `/public`. Need to decide production serving strategy for React.

**Decision:** In production, Nginx serves the React build (`/frontend/dist`) directly. NestJS only handles `/api/*` and `/health` routes.

**Alternatives considered:**
- Keep ServeStaticModule: simpler but couples frontend deployment to backend
- CDN (CloudFront/Vercel): better performance but adds cost/complexity

**Tradeoffs:**
- Gain: Frontend and backend can be deployed independently, Nginx is faster at static files, frontend gets long cache headers
- Lose: More complex docker-compose, need Nginx config

**Consequences:** Development uses Vite's proxy (`vite.config.ts: server.proxy`) to forward `/api` to NestJS. Production uses Nginx reverse proxy.

---

_(New decisions will be added below as they are made during implementation)_
