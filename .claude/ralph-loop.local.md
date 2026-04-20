# Ralph Spec Loop — Tradeverse 2.0 (Full Stack)

Read and follow `.claude/ralph-spec-prompt.md` exactly. State is in `.claude/ralph-state.md`. Spec is in `.claude/ralph-spec.md`.

## Current Project Status

- **Project**: Tradeverse 2.0 — Trading and copy-trading platform
- **Location**: `/Users/thuanle/Documents/JSR/TV 2.0/`
- **Phase**: PLAN (research and decomposition complete)
- **Backend**: Not yet started (`api/` will be created in Wave 1)
- **Frontend**: Existing scaffold in `app/` (Phases 0-2 from prior work)
- **Planning Complete**: CopyPro API docs, design system, 48 units, dev standards

## Key Reference Files

- `.claude/TASKS.md` — Master task list with 48 units and wave table
- `.claude/ralph-state.md` — Unit status table and current wave
- `design.md` — Dark trading UI system (Inter, Instrument Serif, JetBrains Mono, OKLCH)
- `.agents/skills/tradeverse-dev-standards/SKILL.md` — Backend coding law
- `docs/external/copypro-api-documentation.md` — CopyPro REST API reference
- `docs/external/copypro-integration-architecture.md` — Orchestration flow
- `docs/blueprint/CONFIG_CATALOG.md` — Configurable values catalog
- `docs/blueprint/BEHAVIOR.md` — Error taxonomy and UX patterns

## Tech Stack Reminder

### Backend
- Fastify 5 + TypeScript + ESM
- Prisma 6 + PostgreSQL 16
- Zod validation
- bcryptjs + jsonwebtoken auth
- Vitest for testing

### Frontend
- React 19 + TypeScript + Vite 8
- Tailwind CSS 4
- Zustand state management
- React Router v7
- Lucide React icons
- Inter / Instrument Serif / JetBrains Mono fonts

## Critical Rules

1. Read `.claude/ralph-state.md` FIRST to check current phase and wave
2. Execute ONLY the phase logic matching current phase
3. Update `.claude/ralph-state.md` at the END of every iteration
4. Use `cd "/Users/thuanle/Documents/JSR/TV 2.0/"` before running any commands
5. NEVER modify `.claude/ralph-loop.local.md` frontmatter
6. When product is fully delivered: output `\u003cpromise\u003eSPEC COMPLETE\u003c/promise\u003e`

## Design System Context

- **Dark mode first.** Page bg `#030611`, cards on `rgba(14,20,44,0.55)`.
- **Typography:** Instrument Serif for headlines, Inter for UI, JetBrains Mono for data.
- **Colors:** OKLCH semantic palette (green=profit, red=loss, blue=primary).
- **Components:** Glassmorphism cards, 14px radius, 0.28s transitions.
- **Reference:** `design.md` — read it before any UI work.

## Architecture Context

- **Layers:** Route → Controller → Service → Repository → Database.
- **Errors:** DomainError with codes USER_INPUT / USER_STATE / BUSINESS_RULE / SYSTEM_ERROR.
- **External calls:** CopyPro client lives in Service layer. No DB transactions around external calls.
- **Config:** All financial values come from CONFIG_CATALOG, snapshotted at creation time.
