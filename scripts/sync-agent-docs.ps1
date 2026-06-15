# Sync Codex skill mirrors from canonical Claude/Cursor skills.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Skills = @('collabspace-fe-codebase', 'fe-api-integration', 'fe-feature-planner', 'local-dev-verify')

foreach ($skill in $Skills) {
    $src = Join-Path $Root ".claude\skills\$skill\SKILL.md"
    $dst = Join-Path $Root ".agents\skills\$skill\SKILL.md"
    if (-not (Test-Path $src)) {
        throw "missing source: $src"
    }
    $dstDir = Split-Path -Parent $dst
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }
    Copy-Item -Force $src $dst
    Write-Host "synced $skill"
}

Write-Host 'Done. Codex skills mirror .claude/skills/. Update .codex/agents/*.toml manually when subagent prompts change.'
