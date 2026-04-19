# Tradeverse 2.0 — Project Instructions

## Commands

```bash
npm run dev      # start dev server (run from app/ or features/*/)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # preview production build
```

No typecheck script — type errors surface via `npm run build` (tsc -b).

## Architecture

Worktree layout — all real code lives in worktrees, never root:

```
TV 2.0/              # detached HEAD — infrastructure only
├── app/             # core branch — main application code
├── features/
│   ├── auth/        # feature/auth branch
│   ├── dashboard/   # feature/dashboard branch
│   └── trading/     # feature/trading branch
├── design.md        # visual design system — DO NOT EDIT
├── AGENTS.md        # legacy agent-orientation doc (retained, read-only)
└── WORKSPACE.md     # worktree workflow reference
```

Stack: React 19 + TypeScript (strict) + Vite 8. Tailwind CSS, shadcn/ui, Zustand, React Router v7, TanStack Query — to be installed per AGENTS.md.

`src/` layout inside each worktree: `components/ui/`, `components/common/`, `pages/`, `hooks/`, `stores/`, `lib/`, `types/`, `styles/`, `assets/`.

## Key Decisions

- **design.md is the sole visual authority.** Colors, typography (Geist/Geist Mono), spacing scale, border radius, shadows — all defined there. Never guess or hardcode visual values.
- **AGENTS.md dictates HOW to build** (conventions, patterns, state management). Never mix design.md and AGENTS.md concerns in a single prompt.
- **Worktree-based parallel feature dev.** Each feature gets an isolated branch + directory. Merge into `app/` (core branch) when ready; clean up worktree after merge.
- JWT stored in localStorage; token refresh + auth guards required. OAuth: Google, Apple, Telegram.
- Zustand for client state; TanStack Query for server state — do not duplicate server state into stores.

## Domain Knowledge

- Tradeverse = web-based trading + copy-trading platform.
- `core` branch = main app (`app/` worktree). `feature/*` branches = feature worktrees under `features/*/`.
- `design.md` uses a Vercel-inspired system: #171717 black, #ffffff white, #0a72ef blue accent, #de1d8d pink, #ff5b4f red.

## Workflow

- Always `cd app/` or `cd features/<name>/` before running commands or committing.
- Run `npm run build` after a series of changes to catch type errors.
- New feature: `./scripts/new-feature.sh <name>` from root. Remove after merge: `./scripts/remove-feature.sh <name>`.
- Keep features in sync with core: `git rebase core` from inside the feature worktree.
- Reference `design.md` for every visual decision before writing CSS or Tailwind classes.

## Don'ts

- Never commit from the root directory — it is in detached HEAD state.
- Never mix design.md concerns (visuals) and AGENTS.md concerns (architecture/patterns) in one prompt.
- Don't modify `design.md` — it is the read-only visual source of truth.
- Don't modify generated files (`*.gen.ts`, `*.generated.*`).
- Don't use `any` — use `unknown` when type is uncertain.
- Don't inline styles when Tailwind classes exist.
