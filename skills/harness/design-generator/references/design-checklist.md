# Technical Design Quality Checklist

Use this checklist in Step 5 of the design-generator workflow. Mark each item ✅ / ⚠️ / ❌.

---

## Category 1: Context Alignment

| # | Check | How to verify |
|---|-------|---------------|
| 1.1 | Tech stack choices match CLAUDE.md (no unapproved libraries) | Cross-reference dependencies listed in design vs CLAUDE.md |
| 1.2 | Naming conventions follow CLAUDE.md (modules, methods, fields) | Spot-check proposed names against conventions |
| 1.3 | Logging approach uses the project's logging library and format | Check design references correct logger; fields match logging standards |
| 1.4 | No patterns listed in docs/code-constraints.md | Search constraints file for keywords matching the design |
| 1.5 | Design workflow aligns with AGENTS.md collaboration conventions | Review checklist, task conventions, and escalation rules in AGENTS.md |

## Category 2: Architecture Integrity

| # | Check | How to verify |
|---|-------|---------------|
| 2.1 | Module dependencies flow in the direction defined in ARCHITECTURE.md | Draw the dependency arrows; confirm no reverse dependencies |
| 2.2 | No new cross-cutting dependencies introduced without justification | Each inter-module call is documented and justified |
| 2.3 | Data access goes through the declared access layer (repo/service) | No direct DB calls from wrong layers |
| 2.4 | Existing shared utilities used instead of re-implemented | Prior art search found and used relevant existing code |

## Category 3: Interface Completeness

| # | Check | How to verify |
|---|-------|---------------|
| 3.1 | All new APIs have request/response types defined | Template section 4 is complete |
| 3.2 | Error cases are enumerated (not just happy path) | Error conditions listed in interface section |
| 3.3 | Event/message contracts include producer, consumers, and payload | If events used, section 4 is complete |
| 3.4 | Breaking changes to existing interfaces are explicitly called out | Section 9 "backwards compatibility" addresses this |

## Category 4: Data Model

| # | Check | How to verify |
|---|-------|---------------|
| 4.1 | New fields/tables follow naming conventions | Spot-check against CLAUDE.md / AGENTS.md or DATABASE standards |
| 4.2 | Migration implications stated for any schema changes | Section 5 notes migration needs |
| 4.3 | Nullable vs non-nullable decisions are deliberate | No implicit nullability; each field is justified |

## Category 5: Decision Quality

| # | Check | How to verify |
|---|-------|---------------|
| 5.1 | At least one alternative was considered for non-trivial choices | Section 6 "Options Considered" is not empty |
| 5.2 | Rejected alternatives have documented reasons | Each rejected option has a "Rejected because..." entry |
| 5.3 | Open questions are listed, not silently assumed | Section 8 is present and honest |
| 5.4 | Prior art finding is documented (found or confirmed absent) | Section 7 is complete |

## Category 6: Implementation Readiness

| # | Check | How to verify |
|---|-------|---------------|
| 6.1 | Implementation steps are ordered (earlier steps don't depend on later ones) | Section 10 sequence is topologically valid |
| 6.2 | Each step is independently testable | Steps do not require the whole feature to be complete to verify |
| 6.3 | Performance implications are addressed | Section 9 risk table includes performance row if relevant |
| 6.4 | Security implications are addressed | Section 9 addresses auth, input validation, data exposure |

---

## Checklist Scoring

| Result | Meaning |
|--------|---------|
| All ✅ | Design is ready for review |
| Any ⚠️ | Design is usable but reviewer should pay attention to flagged items |
| Any ❌ | Design must be revised before moving to implementation |

A design with ❌ items should not be passed to `/opsx:apply`.
