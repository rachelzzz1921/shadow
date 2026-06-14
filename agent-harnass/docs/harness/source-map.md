# HARNESS Source Map

Updated: 2026-06-10

This source map records the evidence behind `agent.md`. Prefer primary sources and dated claims. If a source changes, update the reuse note instead of silently rewriting the playbook.

## Image-Derived Requirements

Source images supplied by the user:

- `C:/Users/hexu/Desktop/微信图片_20260610125932_18192_4102.png`
- `C:/Users/hexu/Desktop/微信图片_20260610125933_18193_4102.png`

Extracted concepts:

- Move from one-shot Prompt Engineering to Context Engineering + Harness Engineering + Skill Engineering.
- Context Engineering answers "what should the AI see?"
- Harness Engineering answers "how should the AI be embedded into a controllable system?"
- Skill Engineering answers "what reusable capabilities and procedures should the AI have?"
- Loop Engineering closes the loop from human-reprompting to system-driven execution.
- A closed loop needs goal, actor, environment, feedback, memory, and stop condition.
- Feedback should include tests, logs, CI, screenshots, monitoring, and human review.
- Memory should include documents, task boards, issues, and progress logs.

## OpenAI

Primary or near-primary sources:

- OpenAI, "A practical guide to building agents", PDF: https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
  - Reuse: agent fundamentals, tools, guardrails, human-in-the-loop, orchestration, evaluation.
- OpenAI Agents SDK documentation: https://openai.github.io/openai-agents-python/
  - Reuse: agents, tools, handoffs, guardrails, sessions, tracing.
- OpenAI Developers, Agents track: https://developers.openai.com/tracks/building-agents/
  - Reuse: current OpenAI developer path for building agents.
- OpenAI, "Harness engineering: leveraging Codex in an agent-first world": https://openai.com/index/harness-engineering/
  - Reuse: repository knowledge as system of record, `AGENTS.md` as table of contents, feedback loops, app legibility, repository-embedded skills, and agent-generated engineering workflows.
- `AGENTS.md` open format: https://agents.md/
  - Reuse: durable repo guidance file convention for coding agents.
- Lilian Weng, "LLM Powered Autonomous Agents": https://lilianweng.github.io/posts/2023-06-23-agent/
  - Reuse: planning, memory, tool use, reflection taxonomy.

Harness takeaways:

- An agent harness should externalize instructions, tools, guardrails, handoffs, sessions, tracing, and evals.
- A coding harness should include durable repo instructions such as `AGENTS.md`.
- Evals and observability should precede higher autonomy.

## Google / DeepMind

Primary or near-primary sources:

- Google/Kaggle, "Agents" whitepaper: https://www.kaggle.com/whitepaper-agents
  - Reuse: model, tools, orchestration, external action, agent architecture.
- Google Agent Development Kit documentation: https://google.github.io/adk-docs/
  - Reuse: agents, tools, sessions, artifacts, callbacks, evaluation.
- Agent2Agent Protocol: https://a2a-protocol.org/latest/
  - Reuse: multi-agent interoperability and task/message protocol thinking.
- Google DeepMind SIMA project: https://deepmind.google/discover/blog/sima-generalist-ai-agent-for-3d-virtual-environments/
  - Reuse: instruction-following agents operating across environments.

Research:

- "AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents", arXiv: https://arxiv.org/abs/2605.13357
  - Reuse: harness as runtime substrate mediating how agents observe projects, act, receive feedback, verify completion, handle permissions, and produce auditable episode packages.

Harness takeaways:

- Separate model reasoning from orchestration.
- Make tools, sessions, artifacts, and evals explicit.
- Multi-agent protocols matter once single-agent execution is observable.

## Anthropic

Primary or near-primary sources:

- Anthropic, "Building effective agents": https://www.anthropic.com/research/building-effective-agents
  - Reuse: workflows vs agents, prompt chaining, routing, parallelization, orchestrator-worker, evaluator-optimizer.
- Anthropic, "Effective context engineering for AI agents": https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
  - Reuse: context as a designed system surface.
- Anthropic, "Equipping agents for the real world with agent skills": https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
  - Reuse: skills as packaged procedural capability.
- Anthropic, "How we built our multi-agent research system": https://www.anthropic.com/engineering/multi-agent-research-system
  - Reuse: lead agent, subagents, tool use, parallel research, evaluation and failure lessons.
- Model Context Protocol: https://modelcontextprotocol.io/docs/getting-started/intro
  - Reuse: standardizing tool/context connections for agents.

Harness takeaways:

- Use workflows for known paths and agents for dynamic paths.
- Add autonomy gradually with clear feedback loops.
- Package repeatable behaviors as skills.
- Use MCP-style connectors for consistent context and action boundaries.

## Papers And Research Patterns

- ReAct, "Synergizing Reasoning and Acting in Language Models": https://arxiv.org/abs/2210.03629
  - Reuse: interleave reasoning, tool action, and observation.
- Toolformer, "Language Models Can Teach Themselves to Use Tools": https://arxiv.org/abs/2302.04761
  - Reuse: tool-use learning and API-call framing.
- Reflexion, "Language Agents with Verbal Reinforcement Learning": https://arxiv.org/abs/2303.11366
  - Reuse: verbal self-feedback loops after failure.
- Voyager, "An Open-Ended Embodied Agent with Large Language Models": https://arxiv.org/abs/2305.16291
  - Reuse: lifelong learning through executable skill libraries.
- Generative Agents, "Interactive Simulacra of Human Behavior": https://arxiv.org/abs/2304.03442
  - Reuse: memory, reflection, planning, behavior coherence.
- SWE-agent, "Agent-Computer Interfaces Enable Automated Software Engineering": https://arxiv.org/abs/2405.15793
  - Reuse: agent-computer interface as a core determinant of coding-agent performance.

## Refresh Rules

- Recheck provider docs when changing provider-specific claims.
- Recheck research links when adding a new pattern or paper.
- Keep dates on time-sensitive claims.
- Prefer official docs, official blogs, arXiv, or project repositories over commentary.
- If a source cannot be verified, mark it as tentative and do not promote it into `agent.md`.
