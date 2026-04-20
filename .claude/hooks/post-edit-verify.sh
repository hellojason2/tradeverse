#!/usr/bin/env bash
# Post-edit verification hook
# Runs after Claude edits a source file: typecheck + dev server health check
# Event: PostToolUse (Edit|Write)

set -euo pipefail

# Read tool input from stdin
STDIN=$(cat)
FILE_PATH=$(echo "$STDIN" | jq -r '.tool_input.file_path // empty')

# Skip if no file path or not a source file
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only run on TS/TSX/JS files in src/
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  exit 0
fi

if [[ ! "$FILE_PATH" =~ /src/ ]]; then
  exit 0
fi

echo "[post-edit-verify] Checking $FILE_PATH..."

# Check if we're in the API directory
if [[ "$FILE_PATH" =~ api/ ]]; then
  if [[ -f "api/package.json" ]]; then
    cd api
    # TypeScript check (fast, no emit)
    if npx tsc --noEmit 2>&1 | head -20; then
      echo "[post-edit-verify] ✅ TypeScript check passed"
    else
      echo "[post-edit-verify] ❌ TypeScript errors detected. Fix before continuing."
      exit 0  # Don't block, just warn
    fi
  fi
fi

# Check if we're in the app directory
if [[ "$FILE_PATH" =~ app/ ]]; then
  if [[ -f "app/package.json" ]]; then
    cd app
    # TypeScript check
    if npx tsc --noEmit 2>&1 | head -20; then
      echo "[post-edit-verify] ✅ TypeScript check passed"
    else
      echo "[post-edit-verify] ❌ TypeScript errors detected. Fix before continuing."
      exit 0  # Don't block, just warn
    fi
  fi
fi

exit 0
