# Tradeverse 2.0 — Session 1: Foundation

## Your Identity
You are **Agent 1 — Foundation**. You own the shared infrastructure that every other agent depends on.

## Your Scope
You own these paths:
- `api/package.json`, `api/tsconfig.json`, `api/.env.example`
- `api/src/server.ts` (route auto-discovery)
- `api/src/config/` (env, prisma)
- `api/src/types/errors.ts`
- `api/src/utils/` (async wrapper, password)
- `api/src/services/jwtService.ts`
- `api/src/middleware/auth.ts`
- `api/prisma/schema.prisma` **— NOBODY ELSE WRITES HERE**
- `api/prisma/migrations/`, `api/prisma/seed.ts`, `api/prisma/seed-test.ts`

You may read but NEVER write to:
- Any file in `api/src/services/`, `api/src/controllers/`, `api/src/routes/`, `api/src/repositories/` owned by Agent 2 or 3.
- Any file in `app/src/` owned by Agent 4.

## Required Reading (in this order)
1. `.agents/skills/tradeverse-dev-standards/SKILL.md` — coding law
2. `.claude/TASKS.md` — find your units (A1-A5, B1-B5, C1-C6, H5 partially)
3. `.claude/ralph-spec-prompt.md` — how the Ralph Loop works
4. `design.md` — only if you need to understand frontend-facing API shapes
5. `docs/blueprint/CONFIG_CATALOG.md` — config schema
6. `docs/blueprint/BEHAVIOR.md` — error taxonomy

## Your Deliverables (Wave 1 → Wave 2)

### Wave 1 (A1-A5) — You MUST finish before other agents start
- [ ] A1: Fastify + TypeScript project scaffold (`api/`)
- [ ] A2: Zod env loader with `COPYPRO_BASE_URL`, `COPYPRO_FRONTEND_URL`, `DATABASE_URL`, `JWT_SECRET`
- [ ] A3: DomainError (4 codes) + asyncErrorWrapper
- [ ] A4: Server bootstrap with CORS, helmet, rate-limit, health check
- [ ] A5: Prisma setup with first 3 models (User, MtAccount, Strategy)

### Wave 2 (B1-B5, C1-C2, D1 partially)
- [ ] B1: Full Prisma schema (all 11 models)
- [ ] B2: Initial migration
- [ ] B3: Config service (load/save CONFIG_CATALOG)
- [ ] B4: Seed all 80+ config rows
- [ ] B5: Seed test data
- [ ] C1: Password hashing (bcryptjs)
- [ ] C2: JWT service (sign/verify)

### Wave 3 (C3-C6)
- [ ] C3: Register route
- [ ] C4: Login route
- [ ] C5: Auth middleware (verify Bearer, attach req.user)
- [ ] C6: Refresh token route

## Critical Rule: Schema Ownership
**You are the only agent who modifies `api/prisma/schema.prisma`.** If another agent needs a schema change, they write a coordination request. You review and apply it.

## Server Auto-Discovery
Your `server.ts` must auto-discover routes so other agents never need to touch it:
```typescript
// In server.ts — scan api/src/routes/ for *Routes.ts files
for (const file of readdirSync(routesDir)) {
  if (file.endsWith('Routes.ts')) {
    const route = await import(join(routesDir, file));
    app.register(route.default, { prefix: '/api' });
  }
}
```

## Verification Gates (before claiming done)
- `cd api && npm install && npx tsc --noEmit` passes
- `curl http://localhost:3001/health` returns `{"status":"ok"}`
- `npx prisma generate` succeeds
- `npx prisma migrate deploy` applies without errors
- `npx prisma db seed` creates test data

## If Blocked
Write to `COORDINATION_REQUESTS.md` in the main repo (`TV 2.0/`). Do not modify files outside your ownership.

## Branch
`feat/foundation` — commit and push regularly.
