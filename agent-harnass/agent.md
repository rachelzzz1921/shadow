# HARNESS Engineering Playbook

Updated: 2026-06-10

This document turns the two source images and current agent research into a reusable engineering guide for building, operating, and improving AI-agent harnesses.

For source-level traceability, use `docs/harness/source-map.md`. For the provider expert and author index, use `docs/harness/expert-index.md`.

## 1. Core Thesis

The shift is:

`Prompt Engineering -> Context Engineering + Harness Engineering + Skill Engineering`

Prompt engineering asks "how do I ask the model once?" Harness engineering asks "how does the system keep working, checking itself, remembering, and improving without the human staying inside every loop?"

The second image names this as Loop Engineering: move from an open loop where a human repeatedly prompts, checks, and re-prompts, to a closed loop where the system can discover the next task, execute, verify, write memory, decide the next step, and stop or escalate.

## 2. Definitions

Context Engineering designs what the model can see:

- Task goals, constraints, and success criteria.
- Relevant files, docs, data, examples, and prior decisions.
- Tool schemas, environment affordances, and permissions.
- Compact state that survives across turns without flooding the context window.

Harness Engineering designs how the agent is embedded:

- Agent loop and orchestration.
- Tool registry and tool contracts.
- Environment setup, sandboxing, permissions, and secrets boundaries.
- Verification, logging, tracing, evals, and human review.
- Memory, task board, progress journal, and resume behavior.
- Failure handling, retry policy, stop conditions, and escalation policy.

Skill Engineering designs reusable know-how:

- Repeatable task procedures.
- Domain-specific checklists and evidence requirements.
- Scripts, templates, references, and examples.
- Provider/tool-specific recipes that can be loaded only when needed.

## 3. The Minimal Harness Loop

Every reusable harness should explicitly define six parts:

1. Goal: what outcome should be achieved, by when, and under what constraints.
2. Actor: which agent, subagent, script, or human owns the next action.
3. Environment: codebase, browser, APIs, data stores, credentials, and allowed tools.
4. Feedback: tests, logs, screenshots, traces, CI, evals, reviewer notes, or human approval.
5. Memory: durable instructions, task board, progress log, source map, decisions, and artifacts.
6. Stop condition: done, blocked, unsafe, low confidence, budget exceeded, or handoff required.

If one of these is missing, the agent may still answer, but the system is not yet a reliable harness.

## 4. Design Pattern

Use this pattern when building an agent workflow.

### Step 1: State the Job

Write a one-paragraph objective and concrete acceptance checks.

Good acceptance checks mention artifacts and evidence:

- `agent.md` exists and explains context, harness, skills, loop, memory, feedback, and stop conditions.
- `docs/harness/source-map.md` lists primary sources with provider, claim, URL, and reuse note.
- A new skill includes when to use it, workflow, source-refresh rules, and output expectations.

### Step 2: Build the Context Surface

Create or collect:

- User goal and constraints.
- Local files and images.
- Source map with dated claims.
- Project instructions such as `AGENTS.md`.
- A task-state note if work spans multiple sessions.

Context must be curated, not dumped. The model should see the smallest set of facts that lets it act correctly.

### Step 3: Build the Tool Surface

For each tool, define:

- Purpose.
- Inputs and outputs.
- Permissions and risk.
- Verification signal.
- Failure modes.
- Whether it is safe for autonomous use or requires approval.

Typical tools:

- File read/write.
- Shell commands.
- Browser and screenshots.
- Search or docs lookup.
- Test runners and linters.
- Issue tracker or task board.
- Model/API calls.
- MCP servers or provider connectors.

### Step 4: Build the Feedback Surface

Feedback turns generation into engineering.

Use at least one:

- Unit/integration tests.
- Static checks.
- Browser screenshots.
- Structured evals.
- Logs and traces.
- Human review gates.
- Golden examples.
- Reproduction steps for bugs.

For risky or ambiguous work, use two feedback channels: one mechanical and one semantic.

### Step 5: Build Memory

Memory should be explicit and scoped:

- `AGENTS.md`: durable repo instructions for future agents.
- `agent.md`: harness architecture and operating playbook.
- `docs/harness/source-map.md`: evidence and citations.
- `skills/*/SKILL.md`: reusable procedures.
- Task board or progress log: open work, decisions, blockers.

Do not use memory as a place to hide uncertainty. If a claim may change, cite it and date it.

### Step 6: Define Stop and Escalation

Every loop needs brakes:

- Stop when acceptance checks pass and evidence is inspected.
- Escalate when the agent needs credentials, risky permissions, or product judgment.
- Pause when external systems are down.
- Hand off when a specialist skill or human reviewer is needed.
- Roll back or isolate when verification shows regression.

## 5. Provider Lessons

### OpenAI

OpenAI's agent materials emphasize that agents combine models, tools, instructions, guardrails, handoffs, and tracing. The Agents SDK makes these surfaces explicit: agents carry instructions and tools, handoffs route between agents, guardrails validate inputs/outputs, and tracing records execution.

OpenAI's Harness Engineering article adds a coding-agent-specific lesson: repository knowledge should be the system of record, with a short `AGENTS.md` acting as a table of contents into deeper docs, plans, architecture notes, and verification artifacts.

Reusable harness lesson:

- Keep agent instructions, tools, guardrails, handoffs, and traces visible as first-class configuration.
- Treat `AGENTS.md` and skills as durable context surfaces for coding agents.
- Use evals and traces before increasing autonomy.

### Google / DeepMind

Google's agent materials frame agents around models, tools, orchestration, planning, and external action. ADK and A2A point toward agent systems that need sessions, tools, artifacts, evaluation, callbacks, and inter-agent communication.

Reusable harness lesson:

- Separate model reasoning from orchestration.
- Make tools and artifacts explicit.
- Design for multi-agent communication only after the single-agent loop is observable and testable.
- Treat evaluation as part of the harness, not a postscript.

### Anthropic

Anthropic's agent guidance distinguishes workflows from agents. Workflows use predefined code paths; agents dynamically direct tool use and process. Their guidance favors simple composable patterns first: prompt chaining, routing, parallelization, orchestrator-worker, and evaluator-optimizer. Anthropic also emphasizes context engineering, MCP, and agent skills as a way to give agents the right procedural and environmental affordances.

Reusable harness lesson:

- Start with workflows when the path is known.
- Use agents when the model must decide the path.
- Add evaluator-optimizer loops for quality-sensitive work.
- Use MCP/tool connectors to standardize context and action.
- Package repeated procedures as skills rather than longer prompts.
- Treat context as a finite resource; prefer just-in-time retrieval, compaction, note-taking, and subagents for long-horizon work.

## 6. Research Patterns To Reuse

ReAct:

- Interleave reasoning and acting.
- Good for tool use where observations change the next step.

Reflexion:

- Add verbal self-feedback after failure.
- Good for tasks where retries improve with diagnosis.

Voyager:

- Maintain a growing skill library.
- Good for long-horizon domains where discovered routines should become reusable.

Generative Agents:

- Use memory, reflection, and planning to make behavior coherent over time.
- Good for simulations, assistants, and long-running workspaces.

SWE-agent / coding agents:

- The agent-computer interface matters as much as the model.
- Good command surfaces, file views, tests, and edit feedback are core harness design.

AI Harness Engineering:

- Agent success depends on the model-harness-environment system, not only model capability.
- Task specification, context selection, tool access, memory, observability, verification, permissions, and intervention records are runtime substrate responsibilities.

## 7. Harness Templates

### Single-Agent Coding Harness

Use when one agent works in a repository.

- Goal: issue, task, or feature request.
- Actor: coding agent.
- Environment: repo, shell, tests, browser, docs.
- Context: `AGENTS.md`, relevant files, issue, design docs.
- Tools: search, file edit, shell, browser, test runner.
- Feedback: tests, lint, screenshots, code review.
- Memory: changelog, source map, task notes.
- Stop: all acceptance checks pass or blocker is explicit.

### Research-to-Document Harness

Use for this workspace.

- Goal: turn images plus research into reusable harness docs.
- Actor: research/writing agent.
- Environment: local docs, web, image references.
- Context: source images, provider docs, papers.
- Tools: web lookup, local file reads, markdown edits.
- Feedback: citation audit, coverage checklist, file existence.
- Memory: `agent.md`, `source-map.md`, maintenance skill.
- Stop: all requested artifacts exist, claims are sourced, and the source map names any tentative sources.

### Multi-Agent Research Harness

Use when breadth matters.

- Goal: synthesize a large topic.
- Actors: planner, source gatherer, critic, writer.
- Environment: web, papers, local knowledge base.
- Context: shared brief and source map.
- Tools: search, citation extraction, summarization, review.
- Feedback: source quality scoring, contradiction checks, human review.
- Memory: shared bibliography, decision log, open questions.
- Stop: enough independent high-quality evidence supports the conclusions.

## 8. Operational Checklist

Before starting:

- Objective is concrete.
- Acceptance checks are written.
- Current workspace is inspected.
- Source image or source documents are available.
- Risky permissions are identified.

During work:

- Keep a visible plan for multi-step tasks.
- Prefer primary sources.
- Convert repeated procedures into skills.
- Store important claims in the source map.
- Run verification as soon as useful.

Before finishing:

- Inspect every generated artifact.
- Check that citations are present for provider and paper claims.
- Confirm the docs explain context, harness, skills, loop, feedback, memory, and stop conditions.
- Confirm future agents can start from `AGENTS.md`.

## 9. How To Extend This Harness

When adding a new agent workflow:

1. Add the workflow to this file under `Harness Templates`.
2. Add sources or design rationale to `docs/harness/source-map.md`.
3. Add a skill if the workflow is reusable across tasks.
4. Add concrete verification checks.
5. Update `AGENTS.md` only if future agents need durable repo-level instructions.
