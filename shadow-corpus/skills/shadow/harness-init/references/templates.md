# Document Templates

Templates for all harness documentation files. Replace `[TODO: ...]` with real content for existing projects.

---

## CLAUDE.md

```markdown
# [Project Name] — Claude Instructions

## Project Overview

[TODO: 1-2 sentence description of what this project does]

## Tech Stack

- **Language:** [e.g., TypeScript, Go, Python]
- **Framework:** [e.g., Next.js, Gin, FastAPI]
- **Database:** [e.g., PostgreSQL via Prisma]
- **Key dependencies:** [list 3-5 most important libs]

## Repository Structure

```
[paste top-level directory tree here]
```

**Key directories:**
- `src/` — [what lives here]
- `[other key dirs]`

## Code Style & Conventions

- **Formatting:** [e.g., Prettier, gofmt, Black — auto-applied on save]
- **Linting:** [e.g., ESLint with airbnb config, golangci-lint]
- **Naming:** [e.g., camelCase for vars, PascalCase for types, snake_case for DB columns]
- **Imports:** [e.g., absolute imports via `@/`, grouped: stdlib → external → internal]

## Logging Standards

- **Library:** [e.g., winston, zap, structlog]
- **Format:** [e.g., JSON in production, pretty in dev]
- **Required fields:** [e.g., `level`, `timestamp`, `traceId`, `service`]
- **Log levels:** ERROR (user-facing failures) | WARN (recoverable) | INFO (key events) | DEBUG (dev only)

## Testing

- **Unit tests:** [e.g., Jest, go test, pytest] — run with `[command]`
- **Integration tests:** [command]
- **Coverage threshold:** [e.g., 80%]
- **Test file location:** [e.g., co-located `*.test.ts`, or `tests/` directory]

## Key Patterns

[TODO: List 2-4 patterns Claude must follow in this project]
- Example: All API responses use `{ data, error, meta }` envelope
- Example: Database access goes through repository layer only
- Example: Never use `any` type in TypeScript

## Environment Setup

```bash
# Install dependencies
[command]

# Run locally
[command]

# Run tests
[command]
```

## Do Not

- [TODO: Things Claude should never do in this project]
- Example: Do not commit secrets or API keys
- Example: Do not modify generated files in `docs/generated/`
```

---

## AGENTS.md

```markdown
# Agent Collaboration Guidelines

Guidelines for AI agents working on this project.

## Working Agreement

- Read CLAUDE.md and AGENTS.md before writing any code
- Read the relevant section of ARCHITECTURE.md before modifying a module
- Check `docs/exec-plans/active/` for current in-progress plans before starting work
- Do not modify files listed in the "Do Not" section of CLAUDE.md

## Workflow

### Starting a Task

1. Read CLAUDE.md and AGENTS.md to understand project conventions and agent workflow
2. Read the task description thoroughly
3. Identify affected modules in ARCHITECTURE.md
4. Check for existing related plans in `docs/exec-plans/`
5. Scan relevant source files before writing new code

### During Implementation

- Follow code conventions in CLAUDE.md and workflow conventions in AGENTS.md exactly
- Write tests alongside code (not after)
- Keep commits small and focused
- Add entries to `docs/exec-plans/active/` for multi-step tasks

### Before Submitting

- Run linter and formatter
- Run test suite; all tests must pass
- Verify no secrets or debug code in changes
- Update `docs/exec-plans/` if a plan was completed

## Code Review Checklist

When reviewing AI-generated code, verify:

- [ ] Follows naming conventions from CLAUDE.md and workflow conventions from AGENTS.md
- [ ] Uses project logging library correctly
- [ ] No hardcoded values (use env vars or config)
- [ ] Error handling follows project patterns
- [ ] Tests cover the main path and edge cases
- [ ] No unnecessary dependencies added

## Escalation

If a task is ambiguous or blocked, stop and ask rather than guessing. Prefer smaller, reviewable changes over large speculative ones.
```

---

## ARCHITECTURE.md

```markdown
# Architecture Overview

## System Diagram

```
[TODO: ASCII or description of high-level components]

e.g.:
Client → API Gateway → [Service A] → Database
                    → [Service B] → Cache
                    → [Service C] → External API
```

## Components

### [Component Name]

- **Purpose:** [what it does]
- **Location:** `[path/to/module]`
- **Interfaces:** [key APIs or events it exposes]
- **Dependencies:** [what it depends on]

[Repeat for each major component]

## Data Flow

[TODO: Describe how data moves through the system for the main use case]

## Key Design Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| [TODO]   | [TODO]    | [TODO]                 |

## External Dependencies

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| [TODO]  | [TODO]  | [TODO]      |

## Scalability & Limits

[TODO: Known bottlenecks, current scale, planned scaling approach]
```

---

## docs/DESIGN.md

```markdown
# Design Principles

## Core Beliefs

[TODO: 3-5 guiding principles that shape technical decisions in this project]

1. **[Principle]** — [explanation]

## Architectural Constraints

[TODO: Hard constraints the design must respect]
- Example: Must be deployable as a single Docker container
- Example: All data must remain within EU regions

## Trade-offs We Accept

[TODO: Conscious trade-offs made for simplicity or speed]
- Example: We prefer readability over micro-optimization
- Example: We accept eventual consistency in non-critical reads
```

---

## docs/SECURITY.md

```markdown
# Security Guidelines

## Authentication & Authorization

[TODO: How auth works in this project]

## Secrets Management

- Secrets are stored in: [e.g., environment variables, Vault, AWS Secrets Manager]
- Never commit secrets to git — use `.env.example` for templates
- Rotate keys via: [TODO: process]

## Input Validation

- All user input is validated at: [e.g., API boundary using Zod/Pydantic]
- SQL injection prevention: [e.g., parameterized queries via ORM]
- XSS prevention: [e.g., React escapes by default; no dangerouslySetInnerHTML]

## Dependencies

- Scan for vulnerabilities: `[e.g., npm audit, govulncheck]`
- Update cadence: [e.g., weekly automated PRs via Dependabot]

## Incident Response

[TODO: Who to contact and what to do if a security issue is discovered]
```

---

## docs/RELIABILITY.md

```markdown
# Reliability Standards

## SLOs

| Metric | Target |
|--------|--------|
| Availability | [TODO: e.g., 99.9%] |
| P99 latency | [TODO: e.g., <500ms] |
| Error rate | [TODO: e.g., <0.1%] |

## Error Handling

- All errors are logged with context (traceId, userId where applicable)
- User-facing errors return generic messages; details go to logs only
- Retries: [TODO: retry strategy for external calls]

## Observability

- **Metrics:** [TODO: e.g., Prometheus, Datadog]
- **Tracing:** [TODO: e.g., OpenTelemetry]
- **Alerting:** [TODO: key alerts and thresholds]

## Failure Modes

[TODO: List known failure scenarios and how the system behaves]

| Failure | Behavior | Recovery |
|---------|----------|----------|
| DB unavailable | [TODO] | [TODO] |
| External API timeout | [TODO] | [TODO] |
```

---

## docs/QUALITY_SCORE.md

```markdown
# Quality Score Definition

How we measure code and product quality.

## Code Quality Gates

| Check | Tool | Threshold | Blocks Merge |
|-------|------|-----------|--------------|
| Unit test coverage | [TODO] | [TODO: e.g., 80%] | Yes |
| Linting | [TODO] | Zero errors | Yes |
| Type safety | [TODO] | Zero errors | Yes |
| Security scan | [TODO] | No high/critical | Yes |
| Performance | [TODO] | [TODO] | No |

## Review Criteria

All PRs must pass:
- [ ] At least one human code review
- [ ] AI code review (via `/review` or similar)
- [ ] All CI checks green
- [ ] No TODO comments left unresolved

## Definition of Done

A feature is done when:
1. Code is merged and deployed to staging
2. Automated tests pass in staging
3. Manual smoke test complete
4. Monitoring shows no regressions for 24h
```

---

## docs/PLANS.md

```markdown
# Plans & Roadmap

## Current Quarter Goals

[TODO: 3-5 high-level goals for this quarter]

## Active Plans

See `exec-plans/active/` for detailed execution plans.

## Backlog

[TODO: Prioritized list of upcoming work]

| Priority | Item | Estimated Effort |
|----------|------|-----------------|
| P0 | [TODO] | [TODO] |
| P1 | [TODO] | [TODO] |

## Completed

See `exec-plans/completed/` for completed plans.
```

---

## docs/PRODUCT_SENSE.md

```markdown
# Product Sense

## Who We Build For

[TODO: Primary user persona — who uses this, what problem they have]

## Jobs To Be Done

[TODO: The core jobs this product does for users]
1. When [situation], users want to [motivation], so they can [outcome]

## Success Metrics

[TODO: How we know if we're succeeding]

| Metric | Current | Goal |
|--------|---------|------|
| [TODO] | [TODO]  | [TODO] |

## Non-Goals

[TODO: What this product explicitly does NOT try to do]
```

---

## docs/design-docs/index.md

```markdown
# Design Docs Index

| Doc | Status | Date | Summary |
|-----|--------|------|---------|
| [TODO: Add design doc entries as they are created] | | | |

## How to Add a Design Doc

1. Create `docs/design-docs/YYYY-MM-DD-topic.md`
2. Add an entry to this index
3. Include: problem statement, proposed solution, alternatives, decision
```

---

## docs/product-specs/index.md

```markdown
# Product Specs Index

| Spec | Status | Owner | Summary |
|------|--------|-------|---------|
| [TODO] | Draft | [TODO] | [TODO] |

## Spec Template

Each spec should cover:
- **Problem:** What user pain are we solving?
- **Success criteria:** How will we know it worked?
- **Scope:** What is in/out of scope?
- **Design:** UX flow, API changes, data model changes
- **Open questions:** Unresolved decisions
```

---

## docs/exec-plans/tech-debt-tracker.md

```markdown
# Tech Debt Tracker

| ID | Description | Impact | Effort | Priority | Owner | Added |
|----|-------------|--------|--------|----------|-------|-------|
| TD-001 | [TODO: First known tech debt item] | [High/Med/Low] | [S/M/L] | [P0-P3] | [TODO] | [date] |

## Scoring

**Impact:** How much does this slow down development or risk reliability?
**Effort:** S = <1 day, M = 1 week, L = >1 week
**Priority:** P0 = blocking, P1 = soon, P2 = backlog, P3 = nice-to-have

## Process

1. Anyone can add a TD item
2. Review and prioritize monthly
3. Mark resolved items with strikethrough and add resolution date
```
