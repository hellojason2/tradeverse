#!/bin/bash
# Remove a feature worktree
# Usage: ./scripts/remove-feature.sh <feature-name>

set -e

FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
    echo "Usage: ./scripts/remove-feature.sh <feature-name>"
    echo "Example: ./scripts/remove-feature.sh user-profile"
    exit 1
fi

BRANCH_NAME="feature/$FEATURE_NAME"
WORKTREE_PATH="features/$FEATURE_NAME"

# Check if worktree exists
if [ ! -d "$WORKTREE_PATH" ]; then
    echo "Error: Feature '$FEATURE_NAME' not found at $WORKTREE_PATH"
    exit 1
fi

# Confirm removal
read -p "Are you sure you want to remove feature '$FEATURE_NAME'? [y/N] " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

# Remove worktree
echo "Removing worktree at $WORKTREE_PATH..."
git worktree remove "$WORKTREE_PATH" || true

# Remove branch if it exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "Removing branch '$BRANCH_NAME'..."
    git branch -D "$BRANCH_NAME"
fi

echo ""
echo "Feature '$FEATURE_NAME' removed successfully!"
