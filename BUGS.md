# BUGS.md — Production Gotchas Archive

> **Rule:** Every bug that costs > 1 hour to debug gets an entry here.
> **Before fixing a bug:** Search this file for the pattern. If it matches, apply the known fix.
> **Last updated:** 2026-04-20

---

## B-001 — Prisma Decimal serialization in JSON

**Symptom:** API returns `"balance": {}` instead of `"balance": "100.50"`.
**Root cause:** Prisma `Decimal` fields serialize as empty objects in `JSON.stringify()` because Decimal.js instances don't have a custom toJSON.
**Fix:** Use a replacer or serialize manually:
```typescript
// WRONG
res.send({ balance: wallet.balance }); // Decimal → {}

// RIGHT
res.send({ balance: wallet.balance.toString() }); // "100.50"
// OR use a serialization middleware that handles Decimal globally
```
**Date:** Known Prisma behavior
**Files:** Any controller returning Decimal fields.
**Prevention:** Always call `.toString()` on Decimal before JSON serialization. Or use a custom fastify serializer.

---

## B-002 — CopyPro rate limiting on account polling

**Symptom:** `429 Too Many Requests` from CopyPro when polling balances for many accounts.
**Root cause:** CopyPro has undisclosed rate limits. Rapid sequential polling hits them.
**Fix:** Add delays between polling calls, or batch accounts into a single request if CopyPro supports it.
```typescript
// Add delay between polls
for (const account of accounts) {
  await pollBalance(account);
  await sleep(500); // 500ms between calls
}
```
**Date:** Expected behavior
**Files:** `api/src/services/mtAccountService.ts`
**Prevention:** Circuit breaker in `copyProClient.ts` + exponential backoff on 429.

---

## B-003 — Broker symbol suffix mismatch

**Symptom:** CopyPro OrderSend returns "symbol not found" on some brokers.
**Root cause:** Brokers use suffixes (`^`, `.c`, `m`, `mini`) on their symbols. CopyPro's symbol mapping handles some but not all.
**Fix:** Use CopyPro's `/MappedSymbols` endpoint to configure per-copier symbol mappings. Store the mapping in `CopyRelation.brokerMeta` JSONB.
**Date:** Expected broker variation
**Files:** `api/src/services/copyRelationService.ts`
**Prevention:** Always test new broker symbol mappings in staging before production.

---

## B-004 — Ghost CopyPro sessions after restart

**Symptom:** "Too many sessions" or duplicate trade copying after deploying a new backend version.
**Root cause:** Previous CopyPro connections weren't cleanly closed before new ones were created.
**Fix:** Call CopyPro `/Remove` (stop copier) before creating a new one with the same accounts. On backend startup, scan for ACTIVE CopyRelations and verify copier status.
**Date:** Expected deployment behavior
**Files:** `api/src/services/copyRelationService.ts`, startup hook in `server.ts`
**Prevention:** Startup health check: query CopyPro for all active copiers, reconcile with local DB.

---

## B-005 — React state stale after Zustand store update

**Symptom:** UI shows old data after successful API mutation (e.g., deposited but balance doesn't update).
**Root cause:** Component reads from local state instead of Zustand store, or store update happens after component unmounts.
**Fix:** Always read from Zustand store in components. Use `useEffect` to react to store changes. Never duplicate store state in `useState`.
```typescript
// WRONG
const [balance, setBalance] = useState(store.balance);
// RIGHT
const balance = useWalletStore(s => s.balance);
```
**Date:** Common React pattern mistake
**Files:** Any React component using store data.
**Prevention:** Code review — flag any `useState` that mirrors store data.

---

## B-006 — Race condition on subscription activation

**Symptom:** Two rapid clicks on "Activate" create two CopyPro copiers for the same subscription.
**Root cause:** No idempotency check. First request starts copier, second request starts another before first completes.
**Fix:** Use database-level locking or status check:
```typescript
// Check status BEFORE calling CopyPro
if (copyRelation.status !== 'PENDING') {
  throw DomainError('USER_STATE', 'Copy relation is not in PENDING status');
}
// Update status to ACTIVATING (intermediate state) to block concurrent calls
await prisma.copyRelation.update({
  where: { id, status: 'PENDING' },
  data: { status: 'ACTIVATING' }
});
```
**Date:** Expected concurrency issue
**Files:** `api/src/services/copyRelationService.ts`
**Prevention:** Always use status machine with intermediate states for operations that call external APIs.

---

## B-007 — Environment variable type coercion

**Symptom:** `PORT=3001` works, `PORT="3001"` fails, or boolean env vars are always truthy.
**Root cause:** `process.env` values are strings. `if (process.env.ENABLE_FEATURE)` is truthy for `"false"`.
**Fix:** Use Zod schema with coercion:
```typescript
const env = z.object({
  PORT: z.coerce.number().default(3001),
  ENABLE_FEATURE: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
}).parse(process.env);
```
**Date:** Common Node.js pitfall
**Files:** `api/src/config/env.ts`
**Prevention:** Never read `process.env.*` directly. Always go through the Zod schema.
