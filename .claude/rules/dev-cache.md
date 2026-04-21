---
alwaysApply: true
---

# Browser Cache Policy — Local Dev

The dev server (Vite on port 4801) MUST serve with strict no-cache headers so the browser never serves stale bundles. Every hard-refresh the user does is a symptom of this rule being violated.

## Rules

1. **Vite `server.headers` must set `Cache-Control: no-store, no-cache, must-revalidate` + `Pragma: no-cache` + `Expires: 0`** for all dev responses. This is set once in `vite.config.ts` and never removed.
2. **`index.html` must include these meta tags** so the initial HTML document is never cached:
   ```html
   <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
   <meta http-equiv="Pragma" content="no-cache">
   <meta http-equiv="Expires" content="0">
   ```
3. **Service workers MUST unregister in development.** MSW service worker is the exception — it registers fresh on every load. Any other SW registered in prod code must self-unregister when `import.meta.env.DEV === true`.
4. **localStorage persistence** (auth store, theme) is allowed. The cache rule targets network responses + HTML documents only.
5. **When changing build output caching for production later**, do NOT copy the dev headers. Production uses normal long-lived cache headers on hashed asset filenames — separate concern.

## Troubleshooting

If the user reports "UI hasn't changed after my edits":

1. Confirm the dev server is serving from the correct worktree (check `lsof -iTCP:4801` PID → `ps -p <pid> -o args=` or working dir).
2. Confirm Vite's HMR WebSocket is connected (browser console should log `[vite] connected`).
3. Check the response headers for `/` and `/src/main.tsx` — must show `Cache-Control: no-store`. If they don't, the dev server was started with a stale `vite.config.ts`.
4. If the user is using an old tab from a prior session, even with these headers some browsers hold onto old SW-installed assets. `navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))` in the console clears them. Consider adding that one-liner as a dev-only bootstrap.

## Enforcement

- `vite.config.ts` retains the `server.headers` block. Any PR that removes it must be rejected.
- The meta tags in `index.html` are part of the baseline template; do not remove.
