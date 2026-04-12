#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

require_sandbox

issues=$(gh issue list --state open --json number,title,body,comments)
ralph_commits=$(git log --grep="RALPH" -n 10 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No RALPH commits found")

docker sandbox exec \
  --env-file "$REPO_ROOT/.env" \
  -w "$REPO_ROOT" \
  "$SANDBOX_NAME" \
  claude --dangerously-skip-permissions -p \
  "$issues Previous RALPH commits: $ralph_commits @plans/backlog/prompt.md"
