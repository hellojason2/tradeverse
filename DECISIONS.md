# DECISIONS.md — Tradeverse 2.0 Architectural Decisions

> **Rule:** Any decision that took > 30 minutes of discussion becomes an entry here. No exceptions.
> **When revisiting a decision:** Search this file first. If the context has changed, add a new entry — never edit old ones.
> **Last updated:** 2026-04-20

---

## D-0001 — We use CopyPro for trade mirroring, not raw mtapi

**Date:** 2026-04-20
**Why:** CopyPro already has built-in equity protection, copier management, symbol mapping, and trade logging. Its `fixedMasterBalance` parameter matches our risk capital snapshot model exactly.
**Trade-off:** We depend on an external service (CopyPro) we don't control. If it goes down, copying stops.
**Cost/benefit:** Saves 2-4 weeks of master/slave binding code, equity protector logic, and trade log polling infrastructure.
**Revisit if:** CopyPro pricing changes, we hit scaling issues (> 1,000 active copiers), or we need custom symbol logic not supported by CopyPro.

---

## D-0002 — PostgreSQL is source of truth, CopyPro MongoDB is disposable

**Date:** 2026-04-20
**Why:** Prevents split-brain. If CopyPro loses state, we can re-seed from our Postgres records (accounts, copier configs, trade logs we've polled).
**Implication:** Never query CopyPro's MongoDB directly. Always go through CopyPro REST API.
**Trade-off:** Slightly more latency (API call vs direct DB read). Acceptable for our use case.
**Revisit if:** We need sub-second trade state queries that CopyPro API can't provide.

---

## D-0003 — Splits are snapshot on CopyRelation, not read from config at settlement

**Date:** 2026-04-20
**Why:** Prevents retroactive rule changes. A user who subscribed at 60/15/20/5 keeps that deal forever, even if we later change the default split.
**Implementation:** CopyRelation columns are `_snapshot` suffixed (`followerSplitPctSnapshot`, `traderSplitPctSnapshot`, etc.). Settlement code reads from the entity, not from config service.
**Invariant:** If you see `config.get()` in settlement code, it's a bug. See `CONTRACTS.md` C-20.
**Revisit if:** We introduce "dynamic splits" as a feature (unlikely, breaks trust).

---

## D-0004 — We use CopyPro /TradeLogs polling instead of webhooks for trade logging

**Date:** 2026-04-20
**Why:** CopyPro webhook reliability for trade events is untested. Polling every 60s is acceptable latency for our use case (trade history, P&L display).
**Trade-off:** 60s delay between trade close and local log update. Users see trades slightly delayed in UI.
**Revisit if:** CopyPro confirms webhook reliability OR our polling volume becomes too heavy (> 10,000 trades/hour).

---

## D-0005 — One CopyPro userKey per Tradeverse user (not one manager key for all)

**Date:** 2026-04-20
**Why:** Isolation. If one user's CopyPro account gets compromised or rate-limited, it doesn't affect others. Also simplifies account ownership (Tradeverse user owns their MT accounts in CopyPro).
**Trade-off:** More CopyPro user accounts to manage. Slightly more complex registration flow (create CopyPro user on Tradeverse signup).
**Alternative:** Single manager key with all accounts under one CopyPro user. Simpler but no isolation.
**Revisit if:** CopyPro billing makes per-user keys prohibitively expensive.

---

## D-0006 — Prisma + PostgreSQL for backend, not MongoDB or raw SQL

**Date:** 2026-04-20
**Why:** Rapid structural changes expected. Prisma's migration system + `prisma db push` for prototyping makes schema iteration fast. Type-safe queries prevent runtime errors.
**Trade-off:** ORM overhead for complex queries. Some advanced Postgres features require raw SQL.
**Revisit if:** We hit query performance issues that Prisma can't optimize. Raw SQL migrations are the escape hatch.

---

## D-0007 — Fastify over Express for API framework

**Date:** 2026-04-20
**Why:** Better performance, built-in JSON schema validation, native ESM support, plugin architecture fits our layered design (routes → controllers → services → repos).
**Trade-off:** Smaller ecosystem than Express. Fewer Stack Overflow answers.
**Revisit if:** We need middleware that only exists as Express middleware and can't be ported.

---

## D-0008 — Zod over Joi/Yup for validation

**Date:** 2026-04-20
**Why:** Native TypeScript inference. `z.infer<typeof schema>` gives us types without duplicating definitions. Smaller bundle, faster runtime.
**Trade-off:** Less mature ecosystem for complex conditional validation.
**Revisit if:** We need validation rules that Zod can't express (unlikely for our use case).

---

## D-0009 — Dark mode first, light mode secondary

**Date:** 2026-04-20
**Why:** Trading interfaces are used for long periods. Dark mode reduces eye strain. Our design prototypes are all dark-first.
**Trade-off:** Light mode gets less polish. Some color combinations are harder to make accessible in both modes.
**Revisit if:** User feedback strongly prefers light mode (unlikely for trading audience).

---

## D-0010 — Route auto-discovery instead of manual route registration

**Date:** 2026-04-20
**Why:** Prevents merge conflicts. Each agent drops a `*Routes.ts` file into `api/src/routes/`. Server scans and registers automatically. No shared `routes.ts` file to conflict on.
**Trade-off:** Slightly slower startup (directory scan). Route order is filesystem-dependent (usually alphabetical).
**Revisit if:** We need explicit route ordering that auto-discovery can't guarantee.
