# Provider Expert And Pattern Index

Updated: 2026-06-10

This file maps the "OpenAI / Google / Anthropic" research and engineering voices into reusable HARNESS patterns. It is an index, not a biography page. Use it to decide which source to reopen when extending `agent.md`.

## How To Read This Index

- "Role evidence" means a source that verifies the person's current or relevant role.
- "Harness pattern" means the engineering lesson to reuse.
- Do not promote a role title unless it is supported by an official source or clearly marked as external reporting.
- Anthropic's current company page does not expose a public "Chief Scientist" line, so this index uses official Anthropic engineering authors and company-level research sources rather than inventing a title.

## OpenAI

### Jakub Pachocki

- Role evidence: OpenAI identifies Jakub Pachocki as Chief Scientist in the Safety and Security Committee post.
- Source: https://openai.com/index/openai-board-forms-safety-and-security-committee/
- Harness pattern: frontier agents need safety and security review as part of the harness, not only post-hoc model evaluation.
- Reuse in docs: cite when discussing OpenAI leadership and the need for explicit guardrails, safety committees, and escalation paths.

### Lilian Weng

- Role evidence: OpenAI's Safety and Security Committee post lists Lilian Weng as Head of Safety Systems. Her long-form agent article is widely used as an agent taxonomy reference.
- Sources:
  - https://openai.com/index/openai-board-forms-safety-and-security-committee/
  - https://lilianweng.github.io/posts/2023-06-23-agent/
- Harness pattern: agents can be decomposed into planning, memory, tool use, reflection, and action. That maps directly to context, feedback, memory, and loop design.
- Reuse in docs: cite when explaining why "harness" is broader than prompts.

### Ryan Lopopolo

- Role evidence: OpenAI's Harness Engineering post lists Ryan Lopopolo as Member of the Technical Staff and author.
- Source: https://openai.com/index/harness-engineering/
- Harness pattern: humans steer, agents execute; repository-local docs, tests, CI, logs, screenshots, traces, skills, and `AGENTS.md` become the agent's operating environment.
- Reuse in docs: cite when designing coding-agent workspaces and repo-native knowledge systems.

### OpenAI Agents SDK Team

- Role evidence: official Agents SDK docs.
- Sources:
  - https://openai.github.io/openai-agents-python/
  - https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- Harness pattern: expose agents, tools, handoffs, guardrails, sessions, human-in-the-loop, sandboxing, and tracing as explicit primitives.
- Reuse in docs: cite when converting a loop into SDK architecture or choosing between owning the loop and using a managed runtime.

## Google / DeepMind

### Jeff Dean

- Role evidence: Google Research profile says Jeff Dean is Google's Chief Scientist focusing on AI advances for Google DeepMind and Google Research.
- Source: https://research.google/people/jeff/
- Harness pattern: agent harnesses are not only prompts; they rely on large-scale systems, tool interfaces, model infrastructure, and products that make model behavior observable and deployable.
- Reuse in docs: cite when connecting agent work to systems engineering, model infrastructure, and production reliability.

### Google ADK Team

- Role evidence: official Agent Development Kit documentation.
- Source: https://adk.dev/
- Harness pattern: production agents need graph workflows, multi-agent workflows, runtime, observability, evaluation, safety/security, tools, artifacts, sessions, memory, context management, MCP, and A2A.
- Reuse in docs: cite when making a provider-neutral checklist for production agent frameworks.

### A2A Protocol Contributors

- Role evidence: official A2A documentation says Agent2Agent is an open standard originally developed by Google and donated to the Linux Foundation.
- Source: https://a2a-protocol.org/latest/
- Harness pattern: once agents collaborate across boundaries, the harness needs discovery, task/message protocol, secure interoperability, and separation between agent-to-tool (MCP) and agent-to-agent (A2A).
- Reuse in docs: cite when extending from a single-agent loop to multi-agent interoperability.

### Google Agents Whitepaper Authors

- Role evidence: Google/Kaggle whitepaper page.
- Source: https://www.kaggle.com/whitepaper-agents
- Harness pattern: agent architecture is model + tools + orchestration + external action.
- Reuse in docs: cite when explaining the provider-neutral architecture of agents.

## Anthropic

### Erik S. And Barry Zhang

- Role evidence: Anthropic's "Building effective agents" acknowledges the article as written by Erik S. and Barry Zhang.
- Source: https://www.anthropic.com/research/building-effective-agents
- Harness pattern: start simple; distinguish workflows from agents; use prompt chaining, routing, parallelization, orchestrator-worker, and evaluator-optimizer before jumping to unconstrained autonomy.
- Reuse in docs: cite when choosing the lowest-complexity pattern that can pass evals.

### Prithvi Rajasekaran, Ethan Dixon, Carly Ryan, Jeremy Hadfield, And Contributors

- Role evidence: Anthropic's "Effective context engineering for AI agents" lists these authors and contributors from Anthropic's Applied AI team.
- Source: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Harness pattern: context is finite; keep high-signal tokens, use just-in-time retrieval, compaction, structured note-taking, and subagents for long-horizon work.
- Reuse in docs: cite when designing context surfaces and memory behavior.

### Barry Zhang, Keith Lazuka, And Mahesh Murag

- Role evidence: Anthropic's Agent Skills article lists these authors.
- Source: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Harness pattern: package procedural knowledge into discoverable `SKILL.md` folders with progressive disclosure, scripts, references, and eval-first iteration.
- Reuse in docs: cite when turning repeated work into skill packages.

### Jeremy Hadfield, Barry Zhang, Kenneth Lien, Florian Scholz, Jeremy Fox, And Daniel Ford

- Role evidence: Anthropic's multi-agent research system article lists these authors.
- Source: https://www.anthropic.com/engineering/multi-agent-research-system
- Harness pattern: multi-agent research works when breadth, parallel search, separated contexts, strong tool descriptions, memory, citations, observability, and evals are designed together.
- Reuse in docs: cite when designing research harnesses or subagent orchestration.

### Anthropic Company-Level Research Position

- Role evidence: Anthropic company page says it is an AI safety and research company building reliable, interpretable, and steerable AI systems.
- Source: https://www.anthropic.com/company
- Harness pattern: reliability, interpretability, steerability, and safety should be design objectives in the harness itself.
- Reuse in docs: cite when explaining why safety and control are first-class harness requirements.

## Cross-Provider Research Patterns

### ReAct

- Source: https://arxiv.org/abs/2210.03629
- Pattern: interleave reasoning and acting; observations from tools shape the next step.
- Harness reuse: design action/observation loops, not one-shot generation.

### Reflexion

- Source: https://arxiv.org/abs/2303.11366
- Pattern: verbal feedback after failure improves later attempts.
- Harness reuse: write failure reflections into memory or progress logs.

### Voyager

- Source: https://arxiv.org/abs/2305.16291
- Pattern: long-horizon agents benefit from an expandable skill library.
- Harness reuse: promote repeated successful trajectories into skills.

### Generative Agents

- Source: https://arxiv.org/abs/2304.03442
- Pattern: memory, reflection, and planning produce coherent long-running behavior.
- Harness reuse: separate short-term context from durable memory.

### SWE-agent

- Source: https://arxiv.org/abs/2405.15793
- Pattern: the agent-computer interface strongly shapes automated software-engineering performance.
- Harness reuse: optimize shell, file, test, edit, and observation surfaces as seriously as prompts.

## Reusable Synthesis

The common pattern across the three providers is:

1. Context is a designed resource.
2. Tools need clear contracts and low ambiguity.
3. Agent loops need feedback from the environment.
4. Memory must be explicit, scoped, and refreshable.
5. Skills turn repeated work into reusable capability.
6. Multi-agent systems need orchestration, observability, and evaluation.
7. Safety, guardrails, and human escalation are harness features, not optional add-ons.
