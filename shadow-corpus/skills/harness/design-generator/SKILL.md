---
name: design-generator
description: Generate a technical design for a software feature. Use when the user asks to create a technical design, technical proposal, or architecture plan for a feature; or when an openspec proposal has been approved and needs a corresponding design document. Triggers on: "generate technical design", "create design for", "write technical proposal", "design the solution for", or when working on the design phase of an openspec change. Before generating, this skill automatically loads project constraints, searches existing technical solutions for inspiration, and validates the output against architecture rules.
---

# Design Generator

Generate technical designs that are consistent with the project's existing architecture, coding standards, and prior design decisions.

## Overview

Producing a good technical design is not about inventing from scratch. It is about:
1. Understanding what constraints the project imposes
2. Finding what has already been solved in similar ways
3. Designing within those boundaries, not around them

This skill enforces that sequence before writing a single line of design.

## Workflow

### Step 1: Load Project Context

Read these files in order. Stop and report if any are missing (run `/init` first):

```
CLAUDE.md           → tech stack, code conventions, logging standards, key patterns, do-not rules
AGENTS.md           → AI collaboration workflow, task conventions, review checklist, escalation rules
ARCHITECTURE.md     → module structure, dependency rules, data flow
docs/DESIGN.md      → design principles, architectural constraints, accepted trade-offs
docs/code-constraints.md  → P0 bug prohibitions (if exists)
```

Note what you learn: tech stack, module boundaries, forbidden patterns, agent workflow conventions, key design decisions already made.

### Step 2: Search Existing Technical Solutions

Before designing, search for prior art in the project. Read `references/prior-art-search-guide.md` for the full search procedure.

**Quick search targets:**

```bash
# Completed openspec changes (approved designs)
ls openspec/changes/*/  2>/dev/null | head -20

# Design decision records
ls docs/design-docs/    2>/dev/null

# Completed execution plans
ls docs/exec-plans/completed/ 2>/dev/null
```

For each relevant result found, extract:
- The problem it solved (analogous to current need?)
- The approach chosen and why
- Patterns or utilities introduced that can be reused

**Goal:** arrive at the design step with 2-3 concrete prior examples or confirmed "no prior art" for this area.

### Step 3: Read the OpenSpec Proposal

Read the openspec proposal for the current feature. Extract:
- Background and user problem
- Goal and success criteria
- Scope (in / out)
- Acceptance criteria

If no proposal exists, ask the user to create one with `/opsx:new` before proceeding.

### Step 4: Generate the Technical Design

Use `references/design-template.md` as the output structure.

**Key generation rules:**
- Reuse existing modules, utilities, and patterns discovered in Step 2 — do not re-implement what already exists
- Respect module boundaries from ARCHITECTURE.md — no cross-layer shortcuts
- Follow naming conventions from CLAUDE.md and workflow conventions from AGENTS.md exactly
- If multiple approaches are viable, list them in the "Options Considered" section with a clear recommendation; do not silently pick one
- Flag any decisions that depend on unknowns as open questions

### Step 5: Self-Check

Run through `references/design-checklist.md` before presenting the design.

Mark each item as ✅ (satisfied), ⚠️ (partial / uncertain), or ❌ (not addressed).

Present the checklist results alongside the design. Items marked ⚠️ or ❌ must be called out explicitly with a note on why and what is needed to resolve them.

## Output Format

```markdown
## Technical Design: [Feature Name]

**Proposal:** [openspec proposal ID or link]
**Prior art found:** [list of relevant existing designs, or "none"]

### Problem Summary
[1 paragraph: what problem this solves, why now]

### Proposed Solution
[Core approach in 2-3 sentences before details]

#### Module / Component Changes
[For each affected module: what changes and why]

#### Interface Design
[New or modified APIs, events, data contracts]

#### Data Model
[New or modified entities, fields, relationships]

#### Options Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| ...    | ...  | ...  | Chosen / Rejected because... |

#### Open Questions
- [ ] [Question that needs human decision before implementation]

### Impact & Risks
[What could go wrong, what depends on this]

### Implementation Sequence
[Ordered list of implementation steps, maps to openspec tasks]

---
### Design Checklist
[Output from Step 5]
```
