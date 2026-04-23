# Tradeverse 2.0 — Reserved Local Ports

Ports reserved and verified free on **2026-04-21**.

## Port Assignments

| Port | Service | Notes |
|------|---------|-------|
| 4800 | API (Fastify backend) | api/ — env.PORT default 4800 |
| 4801 | Web (Vite frontend) | vite.config.ts server.port with strictPort |
| 4802 | Tooling / Prisma Studio / Adminer | reserved for DB UI, Storybook, aux dev tools |

## Rationale

- Clean gap in the 4096–5000 range, away from common defaults
- Avoids conflicts with: 3000 (CRA/Next), 3001 (old TV default), 3306 (MySQL), 5173 (Vite default), 5432 (PostgreSQL), 8080 (generic HTTP)
- All three confirmed free on this machine on 2026-04-21 before reservation

## Enforcement

### api/.env.example
```
PORT=4800
```

### api/src/config/env.ts
```ts
PORT: z.string().default('4800').transform(Number),
```

### vite.config.ts (frontend)
```ts
server: { port: 4801, strictPort: true },
preview: { port: 4801, strictPort: true },
```

### Frontend environment (.env.local.example)
```
VITE_API_BASE_URL=http://localhost:4800
```

### Prisma Studio (port 4802)
```bash
npx prisma studio --port 4802
```

## If a Port Is Occupied

`strictPort: true` causes Vite to **fail fast** — do not reassign, kill the occupant:

```bash
lsof -i :4800   # find PID
lsof -i :4801
lsof -i :4802
kill -9 <PID>
```

Never renumber these ports without updating all references and committing here.
