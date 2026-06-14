---
name: harness-maintenance
description: Use when maintaining, extending, applying, or auditing reusable AI-agent harness documentation, source maps, loop designs, or skill packages, especially the corpus at D:\Sync\code\agent-harnass.
---

# Harness Maintenance

Use this skill to keep the HARNESS documentation reusable and evidence-backed.

Canonical corpus path: `D:\Sync\code\agent-harnass`.

## Workflow

1. Locate the HARNESS corpus. If the current workspace has `agent.md` and `docs/harness/source-map.md`, use it. Otherwise use `D:\Sync\code\agent-harnass`.
2. Inspect `AGENTS.md`, `agent.md`, `docs/harness/reuse-summary.zh-CN.md`, `docs/harness/source-map.md`, and `docs/harness/expert-index.md`.
3. Identify the requested change: new source, new workflow, new provider pattern, new skill, or audit.
4. Check primary sources first:
   - OpenAI official docs, SDK docs, or official blog.
   - Google/DeepMind official docs, ADK docs, A2A docs, or official papers.
   - Anthropic official docs/blog, MCP docs, or Claude skill docs.
   - arXiv or project repositories for research papers.
5. Update `docs/harness/source-map.md` before changing broad claims in `agent.md`.
6. Update `agent.md` with practical engineering guidance, not just a summary.
7. Add or update a skill only when the procedure is reusable across future tasks.
8. Verify that the result covers:
   - Goal.
   - Actor.
   - Environment.
   - Feedback.
   - Memory.
   - Stop condition.
   - Context Engineering.
   - Harness Engineering.
   - Skill Engineering.

## Output Expectations

- Claims are cited in `docs/harness/source-map.md`.
- `agent.md` remains concise enough for a future agent to use.
- Provider-specific guidance stays dated and source-backed.
- New loops include acceptance checks and escalation rules.
- New skills include trigger conditions, workflow, and verification expectations.

## Quality Bar

Do not treat a one-off prompt as a harness. A harness must include execution, feedback, memory, and stop conditions.
