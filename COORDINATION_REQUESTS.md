# Tradeverse 2.0 — Coordination Requests

> **How to use this file:** Append your request to the bottom. Tag the owner agent. Do not edit existing entries.
> **When an entry is resolved:** The owner moves it to the "Resolved" section with a date and commit hash.
> **Last updated:** 2026-04-20

---

## Open Requests

| # | Date | From | To | Request | Status |
|---|------|------|----|---------|--------|

---

## Resolved Requests

| # | Date | From | To | Request | Resolution |
|---|------|------|----|---------|------------|

---

## Template for New Requests

Copy this block to the Open Requests table:

```
| NEXT | YYYY-MM-DD | @agentN | @agentM | DESCRIPTION: What you need, why you need it, where it will be used. Be specific. Include file paths if known. | OPEN |
```

---

## Request Categories

### Schema Change Request
```
| # | YYYY-MM-DD | @agentN | @agent1 |
**Schema Change:** Add `equityProtectorUrl` field to `CopyRelation` model.
**Why:** CopyPro equity protector webhook needs to store the callback URL.
**Usage:** `api/src/services/copyRelationService.ts`, method `activateSubscription()`.
**Suggested Type:** `String?` (optional, set on activation).
```

### Dependency Request
```
| # | YYYY-MM-DD | @agentN | @agent1 |
**Dependency:** Need `bullmq` package for background job queue.
**Why:** Trade log polling should run as a scheduled job, not inline.
**Usage:** `api/src/services/copyRelationService.ts`.
**Version:** `^5.0.0`.
```

### API Contract Request
```
| # | YYYY-MM-DD | @agentN | @agentM |
**API Contract:** Need `POST /api/copy-relations/:id/poll-trades` endpoint.
**Why:** Frontend needs a button to manually trigger trade log polling.
**Expected Shape:** `{ ticket: number, symbol: string, lots: Decimal, profit: Decimal, openTime: DateTime, closeTime: DateTime | null }[]`
**Usage:** `app/src/pages/CopyTradingPage.tsx`.
```

### Type Addition Request
```
| # | YYYY-MM-DD | @agentN | @agent1 |
**Type Addition:** Need `SubscriptionStatus` enum with values: PENDING, ACTIVE, PAUSED, CLOSED, BREACHED.
**Why:** Strategy subscription lifecycle states.
**Usage:** `api/src/services/subscriptionService.ts`, `app/src/components/trading/PositionList.tsx`.
```
