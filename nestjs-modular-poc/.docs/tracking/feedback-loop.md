# Feedback Loop

> **Purpose:** THE MOST IMPORTANT DOC. This is where AI learns from mistakes and improves. Claude MUST log every issue, failed approach, and lesson learned here. This prevents repeating mistakes across sessions.

---

## How to Use This File

After EVERY implementation session, Claude must add an entry if:
1. Something didn't work as expected
2. A different approach was needed than initially planned
3. A bug was found and fixed
4. A doc needed to be updated due to reality diverging from plan
5. A dependency behaved differently than documented

### Entry Format

```
## [DATE] — [Short Title]

**Phase:** [Phase number]
**Task:** [Task from tasks.md]
**What happened:** [Describe what was attempted]
**What failed:** [Describe the failure or unexpected behavior]
**Root cause:** [Why it happened]
**Fix applied:** [What was done to resolve it]
**Lesson learned:** [What to do differently next time]
**Docs updated:** [List any .docs/ files that were updated as a result]
```

---

## Entries

## 2026-03-30 — TypeORM `deletedAt: null` Type Error

**Phase:** 1
**Task:** 1.6 Refactor Services
**What happened:** Wrote `where: { deletedAt: null }` in TypeORM FindOptions to filter soft-deleted records.
**What failed:** TypeScript compile error — `FindOptionsWhere` does not accept `null` directly for nullable columns.
**Root cause:** TypeORM's `FindOptionsWhere` type requires `FindOperator<null>` not plain `null` for nullable column filters.
**Fix applied:** Imported `IsNull()` from `typeorm` and used `where: { deletedAt: IsNull() }` instead.
**Lesson learned:** Always use `IsNull()` from typeorm for null checks in repository queries. Never use plain `null` in `where` clauses.
**Docs updated:** feedback-loop.md

---

## 2026-03-30 — Windows psql Interactive Password Prompt

**Phase:** 1
**Task:** 1.2 Docker Setup / DB verification
**What happened:** Ran `psql -h localhost -U dev -d app_dev` via Bash tool.
**What failed:** Command hung waiting for interactive password input — Bash tool cannot handle interactive prompts.
**Root cause:** psql prompts for password when not provided via env var or pgpass file.
**Fix applied:** Used `PGPASSWORD=dev psql -h localhost -U dev -d app_dev -c "\dt"` prefix.
**Lesson learned:** Always prefix psql with `PGPASSWORD=<value>` when running non-interactively. Never rely on interactive prompt in automated/tool contexts.
**Docs updated:** feedback-loop.md

---

## 2026-03-30 — git filter-branch Fails on Windows

**Phase:** 0 (git history cleanup)
**Task:** Remove Co-authored-by lines from commit history
**What happened:** Attempted `git filter-branch --msg-filter` to rewrite commit messages.
**What failed:** Error: "could not open 'nestjs-modular-poc/nul'" — Windows NUL device path not compatible with filter-branch script.
**Root cause:** `filter-branch` uses Unix shell internally and the NUL device path differs on Windows.
**Fix applied:** Used `git rebase --root --exec` with a sed command to strip Co-authored-by lines from each commit.
**Lesson learned:** On Windows, use `git rebase --root --exec` for bulk commit message rewrites. Avoid `filter-branch`.
**Docs updated:** feedback-loop.md

---

## 2026-03-30 — OrdersModule Circular Dependency After TypeORM Refactor

**Phase:** 1
**Task:** 1.6 Refactor OrdersService
**What happened:** OrdersModule had `imports: [UsersModule, ProductsModule]` for cross-module service injection (in-memory pattern).
**What failed:** After switching to TypeORM, the module imports caused circular dependency warnings and were no longer needed.
**Root cause:** TypeORM relations handle joins via `relations: ['user', 'items']` — no need to inject other modules' services.
**Fix applied:** Removed UsersModule and ProductsModule imports from OrdersModule. TypeORM `relations` array handles all joins.
**Lesson learned:** When using TypeORM with relations, you do NOT need to import other feature modules to load related data. Use `relations: ['relationName']` in `findOne`/`findAndCount` options.
**Docs updated:** feedback-loop.md

---

## 2026-03-30 — dist/main.js Path Wrong After Build

**Phase:** 1
**Task:** Testing app startup
**What happened:** Ran `node dist/main` as documented in package.json `start:prod` script.
**What failed:** "Cannot find module" error — file not at `dist/main.js`.
**Root cause:** tsconfig outDir + rootDir combination places output at `dist/src/main.js`, not `dist/main.js`.
**Fix applied:** Used `node dist/src/main.js` for manual runs; used `npm run start:dev` for dev.
**Lesson learned:** Check actual dist output structure before running `node dist/main`. The `start:prod` script in package.json may need updating to `node dist/src/main`.
**Docs updated:** feedback-loop.md

---

## Common Patterns to Watch For

These are known gotchas in this stack. If Claude encounters them, log here and reference for future sessions:

### NestJS

- Circular dependency between modules → use `forwardRef()`
- TypeORM entity not registered → must be in `TypeOrmModule.forFeature([Entity])` in the module
- Global guards skip if not registered via APP_GUARD provider
- ValidationPipe must have `transform: true` for query param type conversion
- `@nestjs/serve-static` conflicts with API routes if exclude patterns aren't set correctly

### TypeORM

- `synchronize: true` must NEVER be used in production (drops and recreates tables)
- Migration generation requires a running database to diff against
- `@JoinColumn()` is required on the owning side of @OneToOne
- Eager loading can cause circular serialization — use `{ eager: false }` and load explicitly
- `DECIMAL` columns come back as strings from PostgreSQL — use transformer
- **`IsNull()` from typeorm — NOT plain `null`** — for nullable column filters in FindOptionsWhere
- TypeORM `relations` array handles joins — no need to import other feature modules

### PostgreSQL

- UUID generation requires `gen_random_uuid()` (built-in since PG 13, no extension needed)
- `INET` type for IP addresses — TypeORM maps it to string
- `TIMESTAMPTZ` (with timezone) is preferred over `TIMESTAMP`
- Indexes on `JSONB` columns require GIN index type
- Always use `PGPASSWORD=` env prefix for non-interactive psql commands

### BullMQ

- Redis connection must be separate from cache connection (different db index)
- Failed jobs stay in failed state — must configure retry or manual cleanup
- Job data must be serializable (no class instances, only plain objects)

### JWT / Auth

- `httpOnly` cookies are not sent in fetch unless `credentials: 'include'` is set
- Refresh token rotation: must invalidate old token BEFORE issuing new one
- bcrypt `compare()` is async — don't forget to await

### Windows / Shell

- `git filter-branch` fails on Windows with NUL device path errors — use `git rebase --root --exec` instead
- psql hangs for interactive password — always prefix with `PGPASSWORD=<value>`

---

## Metrics

| Metric | Value |
|--------|-------|
| Total entries | 5 |
| Issues caused by doc inaccuracy | 0 |
| Issues caused by dependency behavior | 2 |
| Issues caused by wrong approach | 2 |
| Issues caused by environment (Windows) | 2 |
| Docs updated from feedback | 1 |

_(Updated after each session)_
