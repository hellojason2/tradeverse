#!/bin/bash
# List all worktrees with their status
# Usage: ./scripts/status.sh

echo "=== TV 2.0 Worktree Status ==="
echo ""

git worktree list --porcelain | while IFS= read -r line; do
    if [[ $line == worktree* ]]; then
        WORKTREE=$(echo "$line" | cut -d' ' -f2-)
        # Get relative path if inside project
        RELATIVE=$(realpath --relative-to="$(pwd)" "$WORKTREE" 2>/dev/null || echo "$WORKTREE")
        echo "📁 $RELATIVE"
    elif [[ $line == branch* ]]; then
        BRANCH=$(echo "$line" | cut -d' ' -f2-)
        echo "   Branch: $BRANCH"
    elif [[ $line == detached* ]]; then
        echo "   Branch: (detached)"
    elif [[ $line == HEAD* ]]; then
        COMMIT=$(echo "$line" | cut -d' ' -f2-)
        echo "   Commit: ${COMMIT:0:7}"
        echo ""
    fi
done

echo ""
echo "=== Quick Commands ==="
echo "New feature:  ./scripts/new-feature.sh <name>"
echo "Remove:       ./scripts/remove-feature.sh <name>"
echo "Merge:        cd app && git merge feature/<name>"
