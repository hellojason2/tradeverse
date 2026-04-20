#!/usr/bin/env bash
# Post-merge map update hook
# Triggers map-keeper agent after merge to main
# Event: PostToolUse (Bash) — when git merge or git pull is detected

set -euo pipefail

STDIN=$(cat)
COMMAND=$(echo "$STDIN" | jq -r '.tool_input.command // empty')

# Only trigger on merge operations
if [[ ! "$COMMAND" =~ (git\s+(merge|pull|rebase)|merge\s+.*into) ]]; then
  exit 0
fi

echo "[post-merge-map-update] Merge detected. MAP.md should be updated."
echo "[post-merge-map-update] Invoke @map-keeper to update the code map."

# Note: The actual update is done by invoking the map-keeper agent
# This hook just serves as a reminder/trigger
exit 0
