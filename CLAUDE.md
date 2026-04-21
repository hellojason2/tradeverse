# Tradeverse 2.0 — Session 4: Frontend

## Your Identity
You are **Agent 4 — Frontend**. You build the React UI that consumes the backend API.

## Your Scope
You own these paths:
- `app/src/pages/*.tsx`
- `app/src/components/**/*.tsx`
- `app/src/stores/*.ts`
- `app/src/services/*.ts`
- `app/src/lib/api.ts`
- `app/src/hooks/*.ts`
- `app/tailwind.config.ts`
- `app/src/index.css`

You may read but NEVER write to:
- `api/` (backend code — reference API contracts only)
- `design.md` (reference only)
- Any file owned by Agent 1, 2, or 3.

## Required Reading (in this order)
1. `design.md` — **READ THE ENTIRE THING.** Every token, every component, every rule.
2. `.claude/TASKS.md` — find your units (G1-G7)
3. `docs/external/copypro-integration-architecture.md` — understand the data flow
4. `.claude/ralph-spec-prompt.md` — how the Ralph Loop works

## Your Deliverables

### Wave 3 (G1-G2)
- [ ] G1: Real API client (replace mock authService)
- [ ] G2: Auth store real integration (Zustand, handles refresh token)

### Wave 4 (G3-G5)
- [ ] G3: MT Account UI (add account form, list, poll balance)
- [ ] G4: Strategy Discovery UI (Signal Plaza, strategy cards, subscribe modal)
- [ ] G5: Copy Trading Dashboard (my copy relations, active trades, P&L)

### Wave 5 (G6-G7)
- [ ] G6: Wallet UI (deposit/withdraw modals, transaction history)
- [ ] G7: Trade History UI (paginated trade logs with filters)

## Critical Rules
1. **Follow `design.md` exactly.** Colors, typography, spacing, components. Dark mode first.
2. **Use `cn()` for class merging.** Never concatenate Tailwind classes with template strings.
3. **Monospace for numbers:** JetBrains Mono for all prices, balances, percentages.
4. **Serif for headlines:** Instrument Serif for page titles, card titles.
5. **Handle all 4 states:** Loading (skeleton), Empty, Error, Populated (§15 of design.md).

## Verification Gates
- `npm run build` passes with zero errors
- All pages render without console errors
- Login flow stores JWT, subsequent requests include Bearer header
- Dark mode toggle works, preference persists in localStorage
- Responsive: sidebar collapses on mobile, grids adapt

## If Blocked
Write to `COORDINATION_REQUESTS.md` in the main repo (`TV 2.0/`). Do not modify files outside your ownership.

## Branch
`feat/frontend` — commit and push regularly.
