# @tradeverse-dev-standards — Tradeverse 2.0 Development Standards

## Purpose

This skill governs every line of code written for Tradeverse 2.0. It prevents the "a lot of bugs happen" problem by enforcing architecture, error handling, and financial-data discipline at the agent level.

**Sources fused into this skill:**
- `backend-dev-guidelines` (layered architecture, BFRI, Zod, Sentry, testing)
- `BEHAVIOR.md` (error taxonomy, notification patterns, user-feedback rules)
- `CONFIG_CATALOG.md` (never hardcode financial values, snapshot vs always-current)
- `copypro-integration-architecture.md` (CopyPro orchestration rules)

---

## 1. Architecture — Mandatory Layers

Every backend feature MUST traverse these layers. No exceptions. No shortcuts.

```
HTTP Request
    ↓
Route (Fastify) — validates params/body with Zod, NO business logic
    ↓
Controller — orchestrates calls to 1+ services, handles HTTP status mapping
    ↓
Service — contains ALL business logic, throws typed domain errors
    ↓
Repository — Prisma queries only, no business logic, explicit transactions
    ↓
Database (PostgreSQL)
```

### Layer Rules

| Layer | Allowed | Forbidden |
|-------|---------|-----------|
| Route | `request/response`, Zod parse, `asyncErrorWrapper` | Business logic, direct Prisma, raw SQL |
| Controller | Call services, map errors to HTTP, return DTOs | Business decisions, Prisma, throw raw strings |
| Service | Business rules, calculations, call repos, throw `DomainError` | HTTP concerns, direct DB access |
| Repository | Prisma queries, transactions, return raw DB shapes | Business logic, HTTP, external API calls |

**Violation = immediate rewrite.**

---

## 2. Error Taxonomy (from BEHAVIOR.md)

Every service-layer error MUST be a typed `DomainError` with one of these codes:

| Code | HTTP | When to use | User Message Style |
|------|------|-------------|-------------------|
| `USER_INPUT` | 400 | Missing/invalid payload, schema violation | "Please enter a valid email" |
| `USER_STATE` | 409 | Action not allowed in current state | "This strategy is no longer accepting followers" |
| `BUSINESS_RULE` | 422 | Financial or domain rule blocked | "Minimum risk capital is $100" |
| `SYSTEM_ERROR` | 500 | Unexpected crash, DB down, external API fail | "Something went wrong. We've been notified." |

### Error Shape

```typescript
class DomainError extends Error {
  constructor(
    public code: 'USER_INPUT' | 'USER_STATE' | 'BUSINESS_RULE' | 'SYSTEM_ERROR',
    public message: string,
    public meta?: Record<string, unknown>,
    public isOperational: boolean = true,
  ) {
    super(message);
  }
}
```

### Route Wrapper

```typescript
// utils/asyncErrorWrapper.ts
export const asyncErrorWrapper = (fn: FastifyRouteHandler) => {
  return async (req, reply) => {
    try {
      await fn(req, reply);
    } catch (err) {
      if (err instanceof DomainError) {
        req.log.warn({ err, code: err.code, meta: err.meta }, 'DomainError');
        return reply.status(mapCodeToHttp(err.code)).send({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err.meta ? { meta: err.meta } : {}),
          },
        });
      }
      // Unexpected — Sentry
      Sentry.captureException(err);
      req.log.error({ err }, 'Unhandled error');
      return reply.status(500).send({
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Something went wrong. We\'ve been notified.',
        },
      });
    }
  };
};
```

---

## 3. Financial Data Discipline (from CONFIG_CATALOG.md)

### The Golden Rule
**NEVER hardcode a financial value in source code.** Every configurable that affects money MUST come from `CONFIG_CATALOG.md` and be loaded via `unifiedConfig`.

### Snapshot vs Always-Current

| Classification | Behavior | Storage |
|----------------|----------|---------|
| `snapshot` | Locked at entity creation time. Changing the config does NOT retroactively change existing records. | Stored on the entity row (e.g., `CopyRelation.riskCapitalSnapshot`) |
| `always-current` | Reads the latest config value on every use. | Read from config service, not stored on entity |

### Example

```typescript
// WRONG — hardcoded
const MIN_RISK = 100;

// RIGHT — always-current config
const minRisk = await config.get('strategy.limits.min_risk_capital');

// RIGHT — snapshot on entity
const copyRelation = await prisma.copyRelation.create({
  data: {
    riskCapitalSnapshot: config.getAtCreationTime('strategy.limits.min_risk_capital'),
    // ...
  },
});
```

### Sum Group Validation
When writing configs that belong to a sum group (e.g., `atlas_gold_default`), the config service MUST reject any write that breaks the 1.00 total.

---

## 4. External Service URL Discipline

**NEVER hardcode an external service URL in source code.** All third-party API base URLs MUST come from environment variables (`.env`) and be surfaced through `CONFIG_CATALOG.md` as `always-current` operational values.

### CopyPro URLs (canonical)
- **Backend API:** `COPYPRO_BASE_URL` → `copy_engine.base_url` → defaults to `https://copyback3.mrpc.pro`
- **Frontend UI:** `COPYPRO_FRONTEND_URL` → `copy_engine.frontend_url` → defaults to `https://copy3.mrpc.pro`
- **Manager Key:** `COPYPRO_MANAGER_KEY` → `copy_engine.manager_key` → for admin endpoints

### If URLs Change
1. Update `docs/blueprint/CONFIG_CATALOG.md` default values
2. Update `api/.env.example`
3. Update your live `.env`
4. **Do NOT** change source code — the CopyPro client reads from config at runtime.

---

## 5. BFRI — Before Every Feature

Before writing any route, service, or repo, score the feature:

| Score | Meaning |
|-------|---------|
| 1 | Pure CRUD, no external deps |
| 2 | CRUD + simple business rule |
| 3 | External API call (CopyPro, wallet) |
| 4 | Money movement + external API |
| 5 | Concurrent money movement (race conditions) |

**Rules:**
- BFRI ≥ 3: Write integration tests BEFORE implementation.
- BFRI ≥ 4: Require PR review + explicit transaction boundaries.
- BFRI = 5: Architect review mandatory. Consider saga pattern.

---

## 5. Database — Prisma Rules

1. **Every table has `id` (UUID), `createdAt`, `updatedAt`.**
2. **Use `@map` and `@@map` for snake_case columns/tables.**
3. **Enums for state machines MUST have a comment explaining each state.**
4. **Money stored as `Decimal` — never `Float`.**
5. **Indexes declared explicitly in schema, not added later as afterthoughts.**
6. **Migrations named descriptively:** `20260420_add_copy_relation_table`
7. **No raw SQL unless performance-proven necessary.**

### Repository Pattern

```typescript
// repositories/copyRelationRepository.ts
export class CopyRelationRepository {
  constructor(private prisma: PrismaClient) {}

  async findActiveBySlaveAccountId(slaveAccountId: string) {
    return this.prisma.copyRelation.findFirst({
      where: { slaveAccountId, status: 'ACTIVE' },
    });
  }

  async createWithTradeLog(data: CreateCopyRelationInput, tradeLogData: TradeLogInput) {
    return this.prisma.$transaction(async (tx) => {
      const relation = await tx.copyRelation.create({ data });
      await tx.tradeLog.create({ data: { ...tradeLogData, copyRelationId: relation.id } });
      return relation;
    });
  }
}
```

---

## 6. CopyPro Integration Rules

1. **Only the Service layer talks to CopyPro.** Repository layer is PostgreSQL only.
2. **All CopyPro calls are wrapped in a `CopyProClient` class** with timeout, retry, and circuit breaker.
3. **Every CopyPro call is logged** with request/response (sanitize passwords!).
4. **CopyPro `accountId` and `apiId` are stored in `MtAccount` table** — never build them dynamically.
5. **Never call CopyPro inside a Prisma transaction.** External API calls are not rollbackable. Orchestrate at controller level.

### CopyPro Call Flow

```typescript
// Controller — correct
const masterAccount = await mtAccountRepo.findById(strategy.masterAccountId);
const slaveAccount = await mtAccountRepo.findById(copyRelation.slaveAccountId);

// 1. Call CopyPro (external, not rollbackable)
const copierResult = await copyProService.startCopier({
  masterAccountId: masterAccount.copyProAccountId,
  slaveAccountId: slaveAccount.copyProAccountId,
  riskType: strategy.riskType,
  riskValue: computeRiskValue(strategy, copyRelation),
});

// 2. Only after success, update local DB
const updated = await copyRelationRepo.activate(copyRelation.id, {
  copyProCopierId: copierResult.copierId,
});
```

---

## 7. Testing Discipline

| Test Type | What to test | Min Coverage |
|-----------|-------------|--------------|
| Unit | Service logic, calculations, edge cases | 80% of service files |
| Integration | Repository + Prisma (testcontainers) | All repo methods |
| E2E | Full HTTP round-trip (Fastify instance) | All POST/PUT/DELETE routes |
| Contract | CopyPro API shapes (recorded with nock) | All CopyPro client methods |

**No mocked Prisma.** Use `jest` + `testcontainers` for integration tests.

---

## 8. Frontend Error Handling

The frontend MUST consume the unified error shape from §2. No more `err instanceof Error ? err.message : "Invalid credentials"`.

```typescript
// stores/authStore.ts — correct
async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', { /* ... */ });
  const data = await res.json();
  if (!data.success) {
    throw new DomainError(data.error.code, data.error.message, data.error.meta);
  }
  return data.data;
}
```

---

## 9. File Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Route | `*.routes.ts` | `copyRelation.routes.ts` |
| Controller | `*.controller.ts` | `copyRelation.controller.ts` |
| Service | `*.service.ts` | `copyRelation.service.ts` |
| Repository | `*.repository.ts` | `copyRelation.repository.ts` |
| Type / DTO | `*.types.ts` | `copyRelation.types.ts` |
| Zod Schema | `*.schema.ts` | `copyRelation.schema.ts` |
| Test | `*.test.ts` adjacent to file | `copyRelation.service.test.ts` |

---

## 10. Commit Message Format

```
<scope>: <action> <what>

- Why this change matters
- Any BFRI context if relevant
```

Examples:
```
copy-relation: add StartByAccountId orchestration

- BFRI 4: money movement + external API
- Uses compensating pattern: CopyPro call before DB update
```

```
config: snapshot riskCapital on CopyRelation creation

- Implements CONFIG_CATALOG §snapshot rule
- Prevents retroactive config changes affecting existing subs
```

---

**End of SKILL.md. Every agent MUST reference this file before generating code.**
