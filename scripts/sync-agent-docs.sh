#!/usr/bin/env bash
# Sync Codex skill mirrors from canonical Claude/Cursor skills.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS=(collabspace-fe-codebase fe-api-integration fe-feature-planner local-dev-verify)

for skill in "${SKILLS[@]}"; do
  src="$ROOT/.claude/skills/$skill/SKILL.md"
  dst="$ROOT/.agents/skills/$skill/SKILL.md"
  if [[ ! -f "$src" ]]; then
    echo "missing source: $src" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$dst")"
  cp -f "$src" "$dst"
  echo "synced $skill"
done

echo "Done. Codex skills mirror .claude/skills/. Update .codex/agents/*.toml manually when subagent prompts change."
