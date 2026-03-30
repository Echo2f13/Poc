# .docs/ Engineering System — Index

> This folder is the brain of the project. Every design decision, implementation detail, and lesson learned lives here.

---

## Quick Start

1. **What to work on next?** → [tracking/tasks.md](tracking/tasks.md)
2. **Where are we?** → [tracking/progress.md](tracking/progress.md)
3. **What went wrong before?** → [tracking/feedback-loop.md](tracking/feedback-loop.md)
4. **How should Claude operate?** → [workflows/claude-interaction-model.md](workflows/claude-interaction-model.md)
5. **Next prompt to use?** → [workflows/next-execution-prompt.md](workflows/next-execution-prompt.md)

---

## Document Map

### Architecture (Source of Truth)
| Document | Purpose |
|----------|---------|
| [architecture/architecture.md](architecture/architecture.md) | System overview, module map, data flow, directory structure |
| [database/db.md](database/db.md) | Full schema: 16 tables, all columns, indexes, constraints, migration rules |
| [backend/backend.md](backend/backend.md) | API conventions, layering, module list, env vars, dependencies |
| [backend/api-contracts.md](backend/api-contracts.md) | All endpoint definitions with request/response schemas |
| [frontend/frontend.md](frontend/frontend.md) | React component architecture, state strategy, routing |

### Domain Design
| Document | Purpose |
|----------|---------|
| [payments/payments.md](payments/payments.md) | Payment state machine, simulation engine, API contracts, events |
| [security/security.md](security/security.md) | Auth strategy, RBAC matrix, validation rules, OWASP mitigations |
| [security/auth-flow.md](security/auth-flow.md) | Detailed sequence diagrams for register, login, refresh, logout |
| [devops/devops.md](devops/devops.md) | Docker setup, CI/CD pipeline, Nginx config, environment management |
| [observability/observability.md](observability/observability.md) | Logging format, health checks, metrics, error tracking |

### Backend Deep Dives
| Document | Purpose |
|----------|---------|
| [backend/error-handling.md](backend/error-handling.md) | Exception hierarchy, error codes, response format, logging rules |
| [backend/caching-strategy.md](backend/caching-strategy.md) | What to cache, TTLs, invalidation patterns |
| [backend/queue-system.md](backend/queue-system.md) | BullMQ queues, worker logic, job definitions |
| [backend/audit-log-design.md](backend/audit-log-design.md) | What gets audited, capture mechanism, schema |

### Product
| Document | Purpose |
|----------|---------|
| [product/product.md](product/product.md) | User journeys, admin journeys, notification templates, business rules |

### Tracking (Living Documents)
| Document | Purpose |
|----------|---------|
| [tracking/roadmap.md](tracking/roadmap.md) | 9-phase implementation plan with dependencies |
| [tracking/tasks.md](tracking/tasks.md) | Granular task list with status checkboxes |
| [tracking/progress.md](tracking/progress.md) | Phase completion percentages, current work, blockers |
| [tracking/feedback-loop.md](tracking/feedback-loop.md) | Issues encountered, root causes, lessons learned |

### Decisions & Workflows
| Document | Purpose |
|----------|---------|
| [decisions/decisions.md](decisions/decisions.md) | Architectural decision records (ADRs) with rationale |
| [workflows/claude-interaction-model.md](workflows/claude-interaction-model.md) | Rules for how Claude Code operates with .docs/ |
| [workflows/next-execution-prompt.md](workflows/next-execution-prompt.md) | Copy-paste prompts for each implementation phase |

---

## Total Documents: 19

## Domains Covered: 9

## Phases Defined: 9 (Phase 0-Phase 9)
