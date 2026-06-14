# Prior Art Search Guide

How to systematically search the project for existing technical solutions before designing a new one.

## Why Search First

Every non-trivial project accumulates solved problems. A design that ignores prior art:
- Re-implements utilities that already exist (wasted effort, diverging patterns)
- Makes different decisions for the same problem (inconsistent architecture)
- Misses constraints discovered through past failures (re-introduces solved bugs)

The goal is not to copy blindly — it is to understand what has been built, what worked, what did not, and to build the new design on that foundation.

## Search Targets and What to Extract

### 1. Completed OpenSpec Changes

These are approved, implemented designs. The most authoritative prior art.

```bash
ls openspec/changes/ 2>/dev/null
```

For each directory, look for:
- `proposal.md` — the original problem statement
- `design.md` — the approved technical approach
- `spec.md` — the final implementation spec

**What to extract:**
- What problem did it solve? (Is it analogous to the current one?)
- What architectural pattern was used?
- What modules were involved?
- Were there rejected alternatives? Why?

### 2. Design Decision Records

```bash
ls docs/design-docs/ 2>/dev/null
cat docs/design-docs/index.md 2>/dev/null
```

These document significant architectural choices. Read the ones relevant to your feature area.

**What to extract:**
- Decisions already made that the new design must respect
- Trade-offs explicitly accepted (do not re-litigate them without good reason)

### 3. Completed Execution Plans

```bash
ls docs/exec-plans/completed/ 2>/dev/null
```

These capture what was actually built and how. Useful for understanding implementation detail beyond the design doc.

**What to extract:**
- Patterns that emerged during implementation (not always in the design doc)
- Known issues or shortcuts taken (that the new design should avoid)

### 4. Existing Source Code Patterns

When the above documents are sparse, search the codebase directly:

```bash
# Find files related to the feature area by keyword
grep -r "[keyword]" src/ --include="*.ts" -l 2>/dev/null | head -10

# Find existing implementations of a pattern type
grep -r "interface.*Repository" src/ -l 2>/dev/null | head -10
```

Read 2-3 representative files to understand:
- Naming conventions for this type of component
- How similar features are structured
- What shared utilities or base classes are used

## Relevance Scoring

Not all prior art is equally relevant. Prioritize:

| Signal | Relevance |
|--------|-----------|
| Same domain / module | High |
| Same pattern type (e.g., async event, CRUD API) | Medium-High |
| Same tech stack component (e.g., same DB, same message queue) | Medium |
| Same general problem class (e.g., pagination, auth) | Medium |
| Different domain, different pattern | Low — note but don't over-weight |

## Output of the Search Step

After searching, produce a brief summary before proceeding to Step 4 of the design workflow:

```
## Prior Art Found

### Relevant designs:
1. [openspec/changes/PROJ-12] User notification system — uses event-driven fan-out pattern.
   Reusable: NotificationDispatcher base class, retry logic.
   Caution: their batching logic was later refactored (see PROJ-31).

2. [docs/design-docs/2025-11-auth-redesign.md] — token refresh flow.
   Relevant: shows how session state is managed across modules.

### No prior art for:
- The specific domain model changes needed here (new territory).

### Reusable elements identified:
- [src/common/pagination.ts] — pagination utility, use as-is
- [src/infra/event/EventPublisher] — existing publisher, extend don't replace
```

If no relevant prior art is found, state that explicitly. "No prior art" is a valid and useful finding.
