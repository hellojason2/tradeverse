# TV 2.0 Git Worktree Structure

## Overview

This project uses **git worktrees** to enable parallel feature development with isolated environments. Each feature gets its own directory and branch, allowing you to:

- Work on multiple features simultaneously
- Test features independently
- Merge features cleanly into the main app
- Avoid switching branches and stashing changes

## Directory Structure

```
TV 2.0/                          # Root workspace (detached HEAD - infrastructure)
├── app/                         # Main application (core branch)
│   ├── src/
│   ├── public/
│   └── ... (all app code)
├── features/                    # Feature worktrees
│   ├── auth/                    # Authentication feature
│   ├── dashboard/               # Dashboard feature
│   └── trading/                 # Trading feature
├── .git/                        # Main git repository
└── WORKSPACE.md                 # This file
```

## Branch Strategy

| Branch | Purpose | Location |
|--------|---------|----------|
| `core` | Main application code | `app/` |
| `feature/*` | Individual features | `features/*/` |

## Workflow

### 1. Work on the Main App

```bash
cd app
# Make changes, commit to core branch
git add .
git commit -m "feat: add new component"
```

### 2. Start a New Feature

```bash
# From root directory
./scripts/new-feature.sh feature-name

# Or manually:
git branch feature/my-feature core
git worktree add features/my-feature feature/my-feature
```

### 3. Work on a Feature

```bash
cd features/auth
# Make changes, commit to feature/auth branch
git add .
git commit -m "feat: implement login"
```

### 4. Merge Feature into App

```bash
# From app directory
cd app
git merge feature/auth

# Or from root
cd app && git merge feature/auth
```

### 5. Clean Up Merged Feature

```bash
# From root directory
./scripts/remove-feature.sh feature-name

# Or manually:
git worktree remove features/my-feature
git branch -d feature/my-feature
```

## Commands Reference

### List all worktrees
```bash
git worktree list
```

### Create new feature
```bash
./scripts/new-feature.sh <feature-name>
```

### Remove feature
```bash
./scripts/remove-feature.sh <feature-name>
```

### Update feature from core
```bash
cd features/my-feature
git rebase core
```

### Merge feature into core
```bash
cd app
git merge feature/my-feature
```

## Rules

1. **Never commit to root directory** - It's in detached HEAD state
2. **Always work in `app/` or `features/*/`**
3. **Keep features focused** - One feature per worktree
4. **Merge frequently** - Keep features up to date with core
5. **Clean up after merging** - Remove worktrees and branches when done

## Initial Setup

This structure was created with:

```bash
# Root is detached HEAD (infrastructure)
git checkout --detach

# App worktree on core branch
git branch core
git worktree add app core

# Feature worktrees
git branch feature/auth core
git worktree add features/auth feature/auth

git branch feature/dashboard core
git worktree add features/dashboard feature/dashboard

git branch feature/trading core
git worktree add features/trading feature/trading
```
