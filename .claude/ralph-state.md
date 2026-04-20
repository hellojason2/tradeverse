---
phase: BUILD
current_wave: 1
current_unit: 5
total_units: 48
iteration: 5
max_iterations: 100
---

# Ralph State — Tradeverse 2.0 (Full Stack)

## Project Scope

This Ralph Loop covers the **complete Tradeverse 2.0 platform**:
- **Frontend:** React 19 + Tailwind, dark trading UI (`app/`)
- **Backend:** Fastify + TypeScript + PostgreSQL + Prisma (`api/`)
- **Integration:** CopyPro trade copier orchestration
- **Business:** Strategies, subscriptions, wallet, Atlas Gold insurance
- **Plan:** 48 units in 6 waves (see `.claude/TASKS.md`)

## Parallel Worktree Status

| Worktree | Branch | Agent | Status | Blocked Until |
|----------|--------|-------|--------|---------------|
| `TV-2.0-foundation/` | `feat/foundation` | Agent 1 | **READY** | — |
| `TV-2.0-copy-engine/` | `feat/copy-engine` | Agent 2 | BLOCKED | Agent 1 finishes Wave 2 (types + schema locked) |
| `TV-2.0-business-wallet/` | `feat/business-wallet` | Agent 3 | BLOCKED | Agent 1 finishes Wave 2 (types + schema locked) |
| `TV-2.0-frontend/` | `feat/frontend` | Agent 4 | BLOCKED | Agent 1 finishes Wave 2 (types + schema locked) |

**Orchestrator instruction:** Start Agent 1 NOW. Agents 2-4 remain blocked until Agent 1 commits the schema-lock tag (`v0.1.0-types`) to main.

**Schema lock rule:** Once Agent 1 tags `v0.1.0-types`, no schema changes without coordination request. Agent 1 may still append fields to schema, but must notify all agents via `COORDINATION_REQUESTS.md`.

## Research Findings

- CopyPro (copy3.mrpc.pro / copyback3.mrpc.pro) is the execution engine for MT4/MT5 copy trading.
- CopyPro handles: trade copying, equity protection, symbol mapping, order management.
- Tradeverse handles: user auth, strategy management, subscription snapshots, wallet, trade logging.
- Full API docs saved locally in `docs/external/copypro-api-documentation.md`.
- Integration architecture defined in `docs/external/copypro-integration-architecture.md`.
- Development standards in `.agents/skills/tradeverse-dev-standards/SKILL.md`.

## Unit Status

| Unit | Status | Attempts | Notes |
|------|--------|----------|-------|
| A1 | PASSED | 1 | Backend scaffolding |
| A2 | PASSED | 1 | Env config |
| A3 | PASSED | 1 | Error types |
| A4 | PASSED | 1 | Server bootstrap |
| A5 | PASSED | 1 | Prisma setup |
| B1 | PENDING | 0 | Full schema |
| B2 | PENDING | 0 | Migration |
| B3 | PENDING | 0 | Config service |
| B4 | PENDING | 0 | Seed config |
| B5 | PENDING | 0 | Seed test data |
| C1 | PENDING | 0 | Password hashing |
| C2 | PENDING | 0 | JWT service |
| C3 | PENDING | 0 | Register route |
| C4 | PENDING | 0 | Login route |
| C5 | PENDING | 0 | Auth middleware |
| C6 | PENDING | 0 | Refresh token |
| D1 | PENDING | 0 | CopyPro client |
| D2 | PENDING | 0 | MT account routes |
| D3 | PENDING | 0 | Balance polling |
| D4 | PENDING | 0 | Copier start/stop |
| D5 | PENDING | 0 | Trade log polling |
| D6 | PENDING | 0 | Equity webhook |
| E1 | PENDING | 0 | Strategy CRUD |
| E2 | PENDING | 0 | Subscription flow |
| E3 | PENDING | 0 | Activation flow |
| E4 | PENDING | 0 | Closure flow |
| E5 | PENDING | 0 | Trade stats |
| E6 | PENDING | 0 | Atlas Gold logic |
| F1 | PENDING | 0 | Wallet foundation |
| F2 | PENDING | 0 | Deposit flow |
| F3 | PENDING | 0 | Withdrawal flow |
| F4 | PENDING | 0 | Transaction history |
| G1 | PENDING | 0 | Real API client |
| G2 | PENDING | 0 | Auth store real |
| G3 | PENDING | 0 | MT account UI |
| G4 | PENDING | 0 | Strategy discovery UI |
| G5 | PENDING | 0 | Copy trading dashboard |
| G6 | PENDING | 0 | Wallet UI |
| G7 | PENDING | 0 | Trade history UI |
| H1 | PENDING | 0 | Admin middleware |
| H2 | PENDING | 0 | Manager endpoints |
| H3 | PENDING | 0 | CSV export |
| H4 | PENDING | 0 | Notifications |
| H5 | PENDING | 0 | Docker compose |
| H6 | PENDING | 0 | Integration tests |

## Frontend Phase Status (from BLUEPRINT)

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Foundation | DONE | Vite, Tailwind, routing |
| 1 Design System | DONE | 12 UI components |
| 2 Authentication | DONE | Login, register, mock backend |
| 3 Dashboard Layout | PENDING | Sidebar, header, layout shell |
| 4 Portfolio | PENDING | Summary cards, activity feed |
| 5 Market | PENDING | Indices, watchlist, tickers |
| 6 Trading | PENDING | Order entry, chart placeholder |
| 7 Copy Trading | PENDING | Trader discovery, subscribe modal |
| 8 Wallet | PENDING | Deposit/withdraw UI |
| 9 Analytics | PENDING | Performance charts |
| 10 Settings | PENDING | Profile, security, preferences |
| 11 Notifications | PENDING | Dropdown, list page |
| 12 Help Center | PENDING | FAQ, contact form |
| 13 Performance | PENDING | Code split, lazy loading |

## Error Log

## Delivery

## Pending Decisions (Block Wave 4 if Unanswered)

1. **Wallet project path:** User has an existing wallet/crypto Meta API project to reuse. Path not yet provided. If still missing at Wave 4, assume generic wallet schema and document assumption.
2. **CopyPro userKey strategy:** One CopyPro userKey per Tradeverse user, OR one manager key for all? Affects D1-D4 architecture. If still missing at Wave 4, assume one key per user (simpler, more isolated) and document.

## Notes

- Full task decomposition is in `.claude/TASKS.md`
- Parallel groups: A (foundation), B (DB), C (auth), D (CopyPro), E (business), F (wallet), G (frontend), H (admin/polish)
- Maximum parallelism: 8 agents
- Fastest path: Wave 1→2→3→4→5→6
