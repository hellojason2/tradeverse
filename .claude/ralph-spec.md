# Tradeverse 2.0 — Ralph Spec (Full Stack)

## Overview

Build Tradeverse 2.0: a dark-mode trading and copy-trading platform that orchestrates CopyPro (MT4/MT5 trade copier) for execution. The platform owns user auth, strategy management, subscription snapshots, wallet, and trade logging. CopyPro owns the execution layer (copying, equity protection, drawdown).

**This is a full-stack project:**
- **Backend:** Fastify + TypeScript + PostgreSQL + Prisma
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS (existing `app/` has Phases 0-2 scaffold)
- **External Engine:** CopyPro REST API (copy3.mrpc.pro / copyback3.mrpc.pro)

**Planning is complete.** All API docs, design system, architecture, and 48 modular units are documented locally. Do NOT write new planning docs. Execute the units in `TASKS.md`.

---

## Source Documents (Read Before Any Code)

| File | Purpose | When to Read |
|------|---------|--------------|
| `.claude/TASKS.md` | **Master task list.** 48 units across 8 parallel groups (A-H). Waves 1-6. | Every BUILD iteration |
| `.claude/ralph-state.md` | Current phase, wave, unit status table. | Every iteration |
| `design.md` | Dark trading UI: Inter + Instrument Serif + JetBrains Mono, OKLCH palette, glassmorphism. | Before any UI code |
| `.agents/skills/tradeverse-dev-standards/SKILL.md` | Coding law: layered architecture, DomainError taxonomy, CONFIG_CATALOG discipline. | Before any backend code |
| `docs/external/copypro-api-documentation.md` | Complete CopyPro REST API (66 endpoints, all models). | Before any CopyPro integration |
| `docs/external/copypro-integration-architecture.md` | Exact orchestration flow: account onboarding → subscription snapshot → CopyPro activation → trade log polling. | Before groups D or E |
| `docs/blueprint/CONFIG_CATALOG.md` | 80+ configurable values. Never hardcode financials. | Before groups B or E |
| `docs/blueprint/BEHAVIOR.md` | Error taxonomy, notification channels, confirmation patterns. | Before groups C or H |

---

## Completed Research & Planning

- CopyPro API fully documented locally (`docs/external/`)
- Integration architecture defined (snapshot vs always-current, webhook flow)
- Design system extracted from HTML prototypes (`design.md`)
- 48 modular units decomposed into parallel groups (`TASKS.md`)
- Development standards codified (`.agents/skills/tradeverse-dev-standards/SKILL.md`)

## Remaining Work — 48 Units in 6 Waves

Execute exactly the waves defined in `TASKS.md`:

| Wave | Units | Groups | Description |
|------|-------|--------|-------------|
| 1 | A1–A5 | Backend Foundation | Fastify, TypeScript, Prisma, env, errors |
| 2 | B1–B5, C1–C2, D1 | DB & Config + Auth start + CopyPro client | Schema, migrations, config, JWT, CopyPro HTTP client |
| 3 | C3–C6, D2–D3, F1, G1–G2 | Auth finish + Account CRUD + Wallet start + Frontend API | Register/login, MT account routes, wallet foundation, real API client |
| 4 | D4–D6, E1–E3, F2–F4, G3–G5 | Copier + Business core + Wallet finish + Frontend pages | Start/stop copier, strategy/subscription/activation, deposit/withdraw, Signal Plaza, Copy Trading dashboard |
| 5 | E4–E6, G6–G7, H1–H4 | Atlas Gold + Wallet/trade UI + Admin polish | Closure, insurance, admin routes, notifications, CSV |
| 6 | H5–H6 | Delivery | Docker Compose, integration tests |

**Constraint:** A unit may only start when all its `DependsOn` units are **PASSED**.

---

## Tech Stack

### Backend
- **Runtime:** Node.js 22, ESM
- **Framework:** Fastify 5
- **Language:** TypeScript 5.7
- **ORM:** Prisma 6
- **Database:** PostgreSQL 16
- **Validation:** Zod
- **Auth:** bcryptjs + jsonwebtoken
- **Testing:** Vitest (unit), custom integration scripts
- **CopyPro Client:** Native `fetch` with timeout/circuit breaker

### Frontend
- **Framework:** React 19 + TypeScript
- **Build:** Vite 8
- **Styling:** Tailwind CSS 4
- **State:** Zustand
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Fonts:** Inter (UI), Instrument Serif (display), JetBrains Mono (data)

### External
- **CopyPro Backend:** https://copyback3.mrpc.pro/ (REST API — changeable via env)
- **CopyPro Frontend:** https://copy3.mrpc.pro/ (Blazor UI reference)
- **MT4/MT5 APIs:** Self-hosted Docker containers (see `docs/external/copypro-api-documentation.md` Docker section)

---

## Key Conventions

### Backend
1. **Layered architecture:** Route → Controller → Service → Repository → Database. No shortcuts.
2. **All errors are `DomainError`:** USER_INPUT (400), USER_STATE (409), BUSINESS_RULE (422), SYSTEM_ERROR (500).
3. **No DB transactions with external API calls.** CopyPro calls happen outside transactions.
4. **CONFIG_CATALOG discipline:** Read `docs/blueprint/CONFIG_CATALOG.md`. Snapshot values at creation time. Never hardcode financials.
5. **BFRI scoring:** Before every feature, score Business value, Frequency, Risk, Implementation cost.

### Frontend
1. **Follow `design.md` exactly:** Colors, typography, spacing, components. Dark mode first.
2. **Use `cn()` utility** for class merging.
3. **Monospace for numbers:** All prices, balances, percentages use JetBrains Mono.
4. **Serif for headlines:** Instrument Serif for card titles, page headers, welcome banner.

---

## Deliverables

- [ ] 48 backend/frontend units passing their tests
- [ ] Docker Compose one-command startup
- [ ] End-to-end integration test (full flow)
- [ ] README with quick start and env vars
- [ ] `<promise>SPEC COMPLETE</promise>`

---

## Critical Open Questions (Answer Before Wave 4)

1. **Wallet project path:** User has an existing wallet/crypto Meta API project to reuse. Path unknown.
2. **CopyPro userKey strategy:** One CopyPro userKey per Tradeverse user, OR one manager key for all? Affects D1-D4 architecture.

If these are unanswered when reaching Wave 4, make a reasonable assumption, document it in `ralph-state.md` Research Findings, and continue.
