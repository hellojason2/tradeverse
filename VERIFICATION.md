# VERIFICATION.md — UI Verification Protocol

> **Every UI change must pass verification before claiming done.**
> **Last updated:** 2026-04-20

---

## Verification Gates

### Static checks (must pass before any PR)

```bash
cd app
npm run build        # zero TypeScript errors
npm run lint         # zero ESLint errors
npm run typecheck    # tsc --noEmit passes
```

### Visual checks (manual or Playwright)

1. **Component renders without console errors**
   - Open browser devtools
   - Navigate to the page/component
   - Assert: zero red console errors

2. **Dark mode by default**
   - Open page in incognito window
   - Assert: dark background (`#030611`), light text

3. **Light mode toggle works**
   - Click theme toggle
   - Assert: background switches to `#f4f6fb`, text to `#0b1228`
   - Refresh page
   - Assert: preference persists

4. **Responsive breakpoints**
   - Resize to 375px width (mobile)
   - Assert: sidebar hidden, content full width, grids collapse to 1 column
   - Resize to 1024px (tablet)
   - Assert: `.g4` → 2 columns
   - Resize to 1440px (desktop)
   - Assert: full layout, sidebar visible

5. **Loading states**
   - Throttle network to Slow 3G
   - Navigate to data-heavy page
   - Assert: skeleton loaders appear, match layout structure
   - Assert: no generic spinner (unless skeleton impossible)

6. **Error states**
   - Block API endpoint (404 or 500)
   - Assert: error UI appears (not blank page)
   - Assert: retry button present and functional

7. **Empty states**
   - Navigate to page with no data
   - Assert: empty state illustration + text + optional CTA
   - Assert: not just "No data" text

8. **Form validation**
   - Submit empty required form
   - Assert: inline errors appear below each field
   - Assert: error border color (`#ff5555`/50)
   - Assert: focus ring shifts to error color
   - Enter invalid value
   - Assert: validation message is specific

9. **Accessibility**
   - Tab through all interactive elements
   - Assert: visible focus ring on every focusable element
   - Run axe DevTools
   - Assert: zero critical or serious violations

---

## Component-Specific Verification

### Button
- [ ] Hover: brightness increase or color shift
- [ ] Focus: visible ring (`box-shadow: 0 0 0 3px oklch(...)`)
- [ ] Disabled: opacity reduced, cursor not-allowed, no hover effect
- [ ] Loading: spinner inside button, text hidden, button disabled

### Card
- [ ] Glassmorphism background
- [ ] Border `var(--line)`
- [ ] Hover: border shifts to `var(--line-2)`
- [ ] Consistent padding (20px)
- [ ] Consistent radius (14px)

### Table
- [ ] Header: uppercase, JetBrains Mono, `--ink-3`
- [ ] Row hover: subtle blue tint
- [ ] Monospace for numeric columns
- [ ] Sort indicators on sortable columns
- [ ] Empty state when no rows

### Modal
- [ ] Overlay: `rgba(3,6,17,0.7)` with blur
- [ ] Escape key closes
- [ ] Click outside closes
- [ ] Focus trap inside modal
- [ ] Return focus to trigger on close

### Toast
- [ ] Appears at top-right (`top: 78px; right: 28px`)
- [ ] Auto-dismisses after 4 seconds (unless error)
- [ ] Error toasts persist until manually dismissed
- [ ] Stacking: multiple toasts stack vertically with gap

---

## End-to-End Smoke Tests

### Critical user flows

1. **Register → Login → Dashboard**
   - Register with email/password
   - Assert: redirected to login or auto-logged in
   - Login
   - Assert: JWT stored in localStorage
   - Assert: dashboard loads with portfolio stats

2. **Add MT Account**
   - Navigate to Accounts page
   - Fill add account form (type, account number, password, server)
   - Submit
   - Assert: account appears in list
   - Assert: balance polling updates the displayed balance

3. **Subscribe to Strategy**
   - Navigate to Signal Plaza
   - Click on strategy card
   - Enter risk capital within limits
   - Submit
   - Assert: subscription created with PENDING status
   - Admin activates
   - Assert: status becomes ACTIVE, copierId populated

4. **Wallet Deposit**
   - Navigate to Wallet
   - Click Deposit
   - Select amount
   - Submit
   - Assert: transaction appears in history with PENDING status

5. **Trade Log Display**
   - Navigate to Copy Trading
   - Assert: active trades display with correct formatting
   - Assert: P&L numbers are green (profit) or red (loss)
   - Assert: timestamps in JetBrains Mono

---

## Playwright Test Skeleton

```typescript
// tests/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('register and login', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[data-testid="email"]', `test-${Date.now()}@example.com`);
  await page.fill('[data-testid="password"]', 'Password123!');
  await page.fill('[data-testid="name"]', 'Test User');
  await page.click('[data-testid="register-button"]');
  await expect(page).toHaveURL(/\/login|\\/dashboard/);
});

test('dashboard loads portfolio stats', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="portfolio-value"]')).toBeVisible();
  await expect(page.locator('[data-testid="open-orders-count"]')).toBeVisible();
});

test('dark mode by default', async ({ page }) => {
  await page.goto('/');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(3, 6, 17)'); // #030611
});
```
