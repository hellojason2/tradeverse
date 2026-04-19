#!/bin/bash
# Create a new feature worktree
# Usage: ./scripts/new-feature.sh <feature-name>

set -e

FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
    echo "Usage: ./scripts/new-feature.sh <feature-name>"
    echo "Example: ./scripts/new-feature.sh user-profile"
    exit 1
fi

BRANCH_NAME="feature/$FEATURE_NAME"
WORKTREE_PATH="features/$FEATURE_NAME"

# Check if feature already exists
if [ -d "$WORKTREE_PATH" ]; then
    echo "Error: Feature '$FEATURE_NAME' already exists at $WORKTREE_PATH"
    exit 1
fi

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "Error: Branch '$BRANCH_NAME' already exists"
    exit 1
fi

# Create branch from core
echo "Creating branch '$BRANCH_NAME' from core..."
git branch "$BRANCH_NAME" core

# Create worktree
echo "Creating worktree at $WORKTREE_PATH..."
git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"

echo ""
echo "Feature '$FEATURE_NAME' created successfully!"
echo ""
echo "To work on this feature:"
echo "  cd $WORKTREE_PATH"
echo ""
echo "To merge into app:"
echo "  cd app && git merge $BRANCH_NAME"
echo ""
echo "To remove when done:"
echo "  ./scripts/remove-feature.sh $FEATURE_NAME"
