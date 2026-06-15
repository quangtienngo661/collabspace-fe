# Codex subagents

TOML agent definitions for **OpenAI Codex**. Prompts reference canonical docs in `.claude/docs/`.

| File | Claude/Cursor equivalent |
|------|--------------------------|
| `fe-reviewer.toml` | `.claude/agents/fe-reviewer.md` |
| `fe-be-alignment.toml` | `.claude/agents/fe-be-alignment.md` |

## Skills

Codex loads skills from `.agents/skills/` (mirrors `.claude/skills/`). Run `scripts/sync-agent-docs.ps1` after skill changes.

## Maintenance

When you change a subagent in `.claude/agents/*.md`, update the matching `developer_instructions` here.

Cross-tool index: `AGENTS.md`.
