# Tradeverse 2.0 — UI Behavior Rules

## Purpose

Every clickable element in Tradeverse must do something real. No dead buttons, no dead-end modals, no plain-text identifiers the user might want to interact with. This document is the interaction authority every frontend agent checks before declaring a surface done.

Companion docs:
- `design.md` — visual authority (colors, typography, layout, motion)
- `CONTRACTS.md` — data-correctness invariants
- `AGENTS.md` — how to build (patterns, state management)
- `BEHAVIOR.md` (this file) — how things BEHAVE when users interact

---

## Core Principles

Three invariants that bind every rule below:

1. **Affordance = Commitment.** If it looks clickable, it commits to doing something meaningful.
2. **Predictability.** Same visual pattern → same behavior across every surface.
3. **Reversibility.** Every interaction the user takes can be undone, closed, or backed out of.

---

## The Ten Rules

### 1. Interactivity Completeness

Every element with a hover state, cursor-pointer, button styling, or link styling commits to a real action: route, mutation, dialog, copy, or an equivalent concrete effect. `onClick={() => {}}` and `href="#"` are forbidden in committed code. When a destination is not built yet, route to a minimal stub page that names the feature and provides a back link — never a dead click.

Applies to: buttons, links, card surfaces, list rows, menu items, badges that look interactive, icons with pointer cursor, tabs, pagination controls.

### 2. External Links

Every link leaving the Tradeverse app uses `target="_blank" rel="noopener noreferrer"` and displays an external-link icon (↗) adjacent to the label. Semantic `<a>` is required for off-site destinations — use `<button>` only for programmatic triggers that do not navigate.

The icon signals "this leaves the app." Users are not surprised by a new tab.

### 3. External Reference Routing

Any external identifier that has an authoritative external home is linked to that home. This is a universal rule — it applies to blockchain tx hashes, invoice numbers, shipping tracking IDs, support ticket IDs, social handles, map coordinates, SKUs, DOIs, and anything else with a canonical URL form.

**Implementation is a central registry**: `src/lib/externalLinks.ts`. Every feature that introduces a new external-reference type registers it once. Consumers call `buildExternalLink(type, value, params)` — URLs are never hardcoded in components.

Display policy for every registered reference:
- Truncate long values for display (e.g. `0xabc1…f456`, `TKT-0004…12`).
- Pair with a copy-to-clipboard icon.
- Use monospace font for technical values that users copy.
- `target="_blank" rel="noopener noreferrer"` on the link itself.

### 4. Drill-Down Navigation

Any row, card, or visually grouped element that represents a single entity navigates to that entity's detail view on click. Secondary action buttons inside the row/card (dismiss, archive, approve) must call `event.stopPropagation()` so they do not also trigger the row click.

Affordance cues: `cursor: pointer`, subtle hover elevation or border shift, entire surface clickable (not just one internal element).

### 5. Dismissibility

Every overlay — modal, dialog, sheet, popover, tooltip — closes via all three:
- Explicit close button (X in a corner, with `aria-label`)
- Escape key
- Backdrop click

Exception: destructive confirmations (delete, reject, unfollow, etc.) allow X + Esc only. Backdrop-click-to-cancel on a destructive confirm is ambiguous and risks accidental dismissal mid-read.

shadcn `<Dialog>` / `<Sheet>` / `<Popover>` provide the three dismissal paths by default — do not override them without documented justification.

### 6. Back Navigation

Every detail view provides a back affordance:
- "← Back" link at the top, or
- Breadcrumbs on deep views (>2 levels)
- Never rely solely on the browser back button

List filter/sort state is URL-driven (`?type=deposit&sort=date`), not component state, so browser back + forward restore the user's prior view exactly.

### 7. Copy-to-Clipboard

Every monospace or identifier value has a copy affordance. One helper: `copyWithToast(value, { label? })` from `src/lib/clipboard.ts`. Click fires a toast "Copied" that auto-dismisses in ~2s. Applies to: hashes, addresses, API keys, request IDs, wallet IDs, referral codes, transaction references, invoice numbers, order IDs, any identifier the user might paste elsewhere.

### 8. Actionable Empty States

Every empty list, empty table, or zero-state panel shows a CTA that matches the user's most likely next action. Copy is written for the specific empty state, not a generic "No data."

Shape:
- Short heading naming the emptiness ("No strategies yet")
- One-line subtext explaining the value ("Follow signal providers to start copy-trading.")
- Primary CTA routing to the action the user would take
- Optional secondary CTA for learning / docs

### 9. Linkified Entity References

Any rendering of an entity name, handle, identifier, or symbol in copy is linked to that entity's canonical destination — internal route for in-app entities, external registry for off-site references. Rule of thumb: if the word refers to something that has its own page or external representation, link it.

Applies regardless of entity type: usernames, strategy names, market symbols, product SKUs, author names, project codes, partner names.

### 10. Loading + Error States Stay Actionable

Loading: use skeleton components that preserve the final layout (same row count, same card dimensions) so the page does not reflow when data arrives. Sidebar and topbar remain usable during fetches — never block navigation.

Error: every error state includes a primary action (Retry for retryable errors; Sign in / Back to list for terminal errors). Never ship "Something went wrong" with no path forward.

---

## Helpers You Must Use

- `src/lib/externalLinks.ts` — `buildExternalLink(type, value, params)` routes any registered external identifier to its canonical URL. Register new reference types in one place.
- `src/lib/clipboard.ts` — `copyWithToast(value, { label? })` wraps Clipboard API + Sonner toast + textarea fallback.
- `src/lib/format.ts` — `formatCurrency / formatPercent / formatDate` (locale-aware via i18next).
- React Router v7 `<NavLink>` + `<Link>` for in-app navigation (never plain `<a href>` for internal routes).
- shadcn `<Dialog>` / `<Sheet>` / `<Popover>` for overlays (they handle the three dismissal paths).

Never hardcode URLs, never hand-roll clipboard, never concatenate currency strings.

---

## Agent Checklist — Before Declaring a Surface Done

Run through this list for every page or component you build or edit. If any answer is "no," fix it before claiming done.

- [ ] Every element with a hover state has a real `onClick` / `href` / route destination
- [ ] Every external link uses `target="_blank" rel="noopener noreferrer"` + ↗ icon
- [ ] Every external identifier routes through `src/lib/externalLinks.ts`
- [ ] Every list row and card navigates to its detail view on click
- [ ] Secondary buttons inside rows/cards use `stopPropagation`
- [ ] Every modal / dialog / sheet closes via X + Esc + backdrop (destructive confirms: X + Esc only)
- [ ] Every detail view has a Back link or breadcrumbs
- [ ] List filter/sort state is URL-param driven
- [ ] Every monospace / identifier value has a copy icon via `copyWithToast`
- [ ] Every empty state has a CTA matching the user's next action
- [ ] Entity names / identifiers rendered in copy are linkified
- [ ] Loading skeletons preserve the final layout
- [ ] Error states include retry or a concrete next action
- [ ] Any new external-reference type is registered in `src/lib/externalLinks.ts`, not hardcoded

---

## Appendix — Concrete Examples

Feature-specific examples live here. The rules above are universal; this section shows how they apply in Tradeverse today. When a new feature ships, append its example here.

### A1. Blockchain transaction hash → block explorer

Register once in `src/lib/externalLinks.ts`:

```ts
registerExternalLink('blockchain-tx', ({ value, network }) =>
  `${EXPLORER_BASES[network]}/tx/${value}`
);
```

Use anywhere:

```tsx
<ExternalRef type="blockchain-tx" value={txn.hash} params={{ network: txn.network }} />
```

Display shows `0xabc1…f456 ↗` with a copy-to-clipboard icon next to it.

### A2. Wallet / contract address → block explorer

Same registry, different type (`blockchain-address`, `blockchain-contract`).

### A3. Strategy name in activity copy → /strategies/:id

Linkified entity reference (Rule 9). Example copy:
"Position closed — [AlphaSignal](/strategies/alpha-signal) realized $847 profit."

### A4. Empty state on /strategies

```tsx
<EmptyState
  title="No strategies yet"
  subtitle="Follow signal providers to start copy-trading."
  primaryCta={{ label: "Browse Signal Plaza", to: "/signal-plaza" }}
/>
```

### A5. Destructive confirmation: Close Position

Dialog with X + Esc dismissal only. Backdrop click does nothing so users cannot accidentally dismiss the confirmation.

### A6. Wallet transaction row drill-down

Clicking the row routes to `/wallet/transactions/:hash`. Inside the row, the explorer-link icon and copy icon both call `stopPropagation` so clicking them does not also trigger the row navigation.

### A7. Loading skeleton for /strategies

Renders 6 placeholder strategy-card skeletons in the same grid layout as the final data, so layout does not reflow when data arrives.

---

When a new feature introduces a new external reference type, new row type, new empty state, or new overlay pattern, append an example to this appendix and register the reference in `src/lib/externalLinks.ts`.
