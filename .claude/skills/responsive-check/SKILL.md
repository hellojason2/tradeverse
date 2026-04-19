---
name: responsive-check
description: Audit one or more routes for responsive parity — captures screenshots at three viewports and runs automated layout checks.
argument-hint: "[route or component path — omit to audit all discovered routes]"
disable-model-invocation: true
---

Audit responsive layout for: **$ARGUMENTS** (or all routes if blank).

Standards: `.claude/rules/frontend.md` § Responsive Parity.

## Step 1: Ensure Dev Server

Check if `npm run dev` is already running:

```bash
lsof -i :5173 | grep LISTEN
```

If nothing is listening, start it in the background:

```bash
npm run dev &
```

Wait until `http://localhost:5173` responds (poll with `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173` until you get `200`).

## Step 2: Determine Routes

If `$ARGUMENTS` is provided, use it as the route list (e.g. `/`, `/about`, `src/pages/Dashboard.tsx`).

If blank, discover routes:

1. Look for a router file: `grep -r "createBrowserRouter\|Routes\|route path" src/ --include="*.tsx" --include="*.ts" -l`
2. Read the first match and extract all `path=` / `path:` values.
3. Fall back to `["/"]` if no router is found.

## Step 3: Screenshot + Assert Each Route × Viewport

Viewports: `375×667` (mobile), `768×1024` (ipad), `1440×900` (desktop).

For each route × viewport, use **Playwright MCP** if available (`mcp__plugin_playwright_playwright__browser_*`), otherwise fall back to `npx playwright` via Bash.

### Playwright MCP path

For each viewport:

1. `browser_resize` to set width × height
2. `browser_navigate` to `http://localhost:5173<route>`
3. `browser_take_screenshot` → save to `.responsive-audit/<route-slug>/<viewport-name>.png`
   - Route slug: replace `/` with `_root`, replace other `/` with `-`, strip leading `-`
4. `browser_evaluate` the four assertions (see below)
5. Record pass/fail per check

### Bash fallback path

Run `tsx scripts/responsive-check.ts` (or `npx ts-node scripts/responsive-check.ts`). Read stdout for results.

## Step 4: Assertions (run in-page for each viewport)

```js
// 1. No horizontal scroll
document.documentElement.scrollWidth <= window.innerWidth

// 2. All interactive elements ≥ 44×44px
Array.from(document.querySelectorAll('button,a,input,select,textarea,[role="button"]'))
  .every(el => {
    const r = el.getBoundingClientRect();
    return r.width >= 44 && r.height >= 44;
  })

// 3. No body text < 16px
Array.from(document.querySelectorAll('p,span,li,td,th,label,div'))
  .filter(el => el.children.length === 0 && el.textContent.trim().length > 0)
  .every(el => parseFloat(getComputedStyle(el).fontSize) >= 16)

// 4. No fixed-width container exceeding viewport
Array.from(document.querySelectorAll('[style*="width"]'))
  .every(el => el.getBoundingClientRect().width <= window.innerWidth)
```

Capture each result as `pass` or `fail: <detail>` (e.g. which element failed).

## Step 5: Report

Output a Markdown table per route, then a combined summary.

```
## Responsive Audit — <route>

| Viewport       | No H-Scroll | Touch Targets ≥44px | Text ≥16px | No Overflow Container | Screenshot |
|----------------|-------------|---------------------|------------|----------------------|------------|
| mobile 375×667 | ✅ / ❌      | ✅ / ❌              | ✅ / ❌     | ✅ / ❌               | [view](.responsive-audit/<slug>/mobile.png) |
| ipad 768×1024  | ...         | ...                 | ...        | ...                  | [view](.responsive-audit/<slug>/ipad.png) |
| desktop 1440×900 | ...       | ...                 | ...        | ...                  | [view](.responsive-audit/<slug>/desktop.png) |

Failures:
- mobile / Touch Targets: <button id="submit"> is 32×28px
```

After all routes:

```
## Summary

X routes audited. Y passed all checks. Z failures across N routes.
```

If all checks pass, say so and stop. If any fail, list each failure with enough detail to act on it (element selector, computed size, viewport).

Do not suggest fixes unless asked — audit only.
