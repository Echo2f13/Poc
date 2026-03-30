# Claude Code Interaction Model

> **Purpose:** MANDATORY operating procedures for Claude Code when working on this project. This document defines HOW Claude should use .docs/ to maintain consistency, prevent regressions, and continuously improve.

---

## RULE 1: Always Read Before Acting

Before ANY implementation work, Claude MUST read these files:

```
ALWAYS READ:
├── .docs/architecture/architecture.md    ← System overview, module map
├── .docs/tracking/tasks.md               ← What to work on next
├── .docs/tracking/progress.md            ← Current state
└── .docs/tracking/feedback-loop.md       ← Known gotchas and past mistakes
```

**Additional reads based on task domain:**

| If working on... | Also read... |
|-------------------|-------------|
| Database / entities | .docs/database/db.md |
| API endpoints | .docs/backend/api-contracts.md, .docs/backend/backend.md |
| Auth / guards | .docs/security/security.md, .docs/security/auth-flow.md |
| Payments | .docs/payments/payments.md |
| Error handling | .docs/backend/error-handling.md |
| Frontend | .docs/frontend/frontend.md |
| Docker / CI/CD | .docs/devops/devops.md |
| Logging / health | .docs/observability/observability.md |
| Background jobs | .docs/backend/queue-system.md |
| Audit logging | .docs/backend/audit-log-design.md |

---

## RULE 2: Follow tasks.md Strictly

1. Find the **first `[ ]` (pending) task** in the current phase
2. Change it to `[~]` (in progress)
3. Implement it following the relevant domain docs
4. Test/verify the implementation
5. Change to `[x]` (done)
6. Move to next task

**NEVER skip tasks.** They are ordered by dependency.
**NEVER work on a later phase** if the current phase has incomplete tasks.

---

## RULE 3: Update Docs After Implementation

After completing ANY task:

### 3a. Update tasks.md
- Mark completed task as `[x]`
- If new subtasks were discovered, add them

### 3b. Update progress.md
- Update phase completion percentage
- Update "Current Task" field
- Add to "Completed Items" section
- Update "Last Updated" date

### 3c. Update feedback-loop.md (if applicable)
Add an entry if:
- Something didn't work as expected
- You had to deviate from the plan
- A dependency behaved differently than documented
- You found a bug in existing code
- You discovered a doc inaccuracy

### 3d. Update domain docs (if reality diverged from plan)
If the actual implementation differs from what a doc describes, UPDATE THE DOC to match reality. Docs must always reflect the current state of the system.

---

## RULE 4: Architectural Changes Require Documentation

If you need to change something defined in architecture.md, db.md, or any design doc:

1. **FIRST:** Add an entry to decisions.md explaining WHY
2. **THEN:** Update the relevant doc
3. **THEN:** Implement the change

Never change architecture silently. The decision record is the justification.

---

## RULE 5: Bug Fix Protocol

When a bug is discovered:

1. Record in feedback-loop.md:
   - What happened
   - Root cause
   - Fix applied
   - Lesson learned
2. Fix the bug
3. If the bug reveals a doc inaccuracy, update the doc
4. If the bug reveals a missing test case, note it for future test writing

---

## RULE 6: Session Start Protocol

At the START of every new Claude Code session:

```
1. Read .docs/tracking/progress.md → Understand where we are
2. Read .docs/tracking/tasks.md → Find next task
3. Read .docs/tracking/feedback-loop.md → Remember past lessons
4. Read relevant domain doc for the next task
5. Begin implementation
```

---

## RULE 7: Session End Protocol

At the END of every Claude Code session:

```
1. Update tasks.md with current status of all touched tasks
2. Update progress.md with what was accomplished
3. If any issues occurred, add to feedback-loop.md
4. Ensure all code changes are saved
5. Summarize what was done and what's next
```

---

## RULE 8: Verification Before Phase Transition

Before moving from Phase N to Phase N+1:

1. ALL tasks in Phase N must be `[x]`
2. ALL verification tasks in Phase N must pass
3. progress.md must show Phase N as 100%
4. No `[!]` (blocked) tasks remain in Phase N

---

## RULE 9: Never Assume, Always Check

- Don't assume a package is installed → check package.json
- Don't assume an entity has a field → check the entity file
- Don't assume a module is imported → check the module file
- Don't assume an endpoint exists → check the controller
- Don't assume a migration has run → check the database

---

## RULE 10: Consistency Over Cleverness

- Follow existing patterns in the codebase
- Use the same naming conventions as other modules
- Don't introduce new libraries without adding a decision record
- Don't optimize prematurely — correctness first
- If unsure between two approaches, check decisions.md for precedent

---

## Quick Reference: File Update Map

| After this action... | Update these docs... |
|---------------------|---------------------|
| Complete a task | tasks.md, progress.md |
| Hit an issue | feedback-loop.md |
| Change DB schema | db.md, generate new migration |
| Add/change endpoint | api-contracts.md |
| Add new module | architecture.md (module map) |
| Make architectural decision | decisions.md |
| Change auth behavior | security.md, auth-flow.md |
| Change payment logic | payments.md |
| Add environment variable | backend.md (env var table) |
| Change Docker setup | devops.md |
