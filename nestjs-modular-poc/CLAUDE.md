# CLAUDE.md — Project Instructions for Claude Code

## Project: MicroAmazon (NestJS E-Commerce SaaS)

## Engineering System

This project uses a `.docs/` folder as the engineering brain. **READ THESE BEFORE ANY WORK:**

### Mandatory Reads (Every Session)
- `.docs/tracking/tasks.md` — What to do next
- `.docs/tracking/progress.md` — Current state
- `.docs/tracking/feedback-loop.md` — Past lessons and gotchas

### Architecture Reference
- `.docs/architecture/architecture.md` — System design, module map, data flow
- `.docs/database/db.md` — Full schema, entities, indexes, constraints
- `.docs/backend/backend.md` — API conventions, layering, env vars
- `.docs/backend/api-contracts.md` — All endpoint definitions
- `.docs/backend/error-handling.md` — Exception classes, error codes
- `.docs/security/security.md` — Auth, RBAC, validation rules
- `.docs/security/auth-flow.md` — JWT flow sequences
- `.docs/payments/payments.md` — Payment state machine, simulation
- `.docs/frontend/frontend.md` — React architecture (for future phase)
- `.docs/devops/devops.md` — Docker, CI/CD, environments
- `.docs/observability/observability.md` — Logging, health checks

### Workflow
- `.docs/workflows/claude-interaction-model.md` — **HOW to operate with these docs**
- `.docs/tracking/roadmap.md` — Phase-based implementation order
- `.docs/decisions/decisions.md` — Architectural decision records

## Key Rules

1. **Follow tasks.md** — Work on tasks in order, never skip
2. **Update docs after implementation** — tasks.md, progress.md, feedback-loop.md
3. **Log architectural changes** — Add to decisions.md before changing design
4. **Log bugs and issues** — Add to feedback-loop.md with root cause and fix
5. **Never break the existing API** — Existing endpoints must continue to work after refactoring
6. **Use TypeORM entities** — All DB access through TypeORM repositories, never raw SQL
7. **Follow response envelope** — All responses use `{ data }` or `{ error }` format
8. **Validate all input** — Every DTO must have class-validator decorators

## Stack

- Backend: NestJS 11, TypeScript 5.7, TypeORM, PostgreSQL 16, Redis 7, BullMQ
- Frontend: React 18, TypeScript, Vite, TanStack Query, Zustand (Phase 8)
- Infrastructure: Docker, Nginx, GitHub Actions

## Current Phase

Check `.docs/tracking/progress.md` for the current implementation phase.
