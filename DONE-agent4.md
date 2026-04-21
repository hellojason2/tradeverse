# DONE — Agent 4 (Frontend)

## Round: Client Portal Navigation + Language Switcher

### Scope (this round)
- `/dashboard` — sidebar navigation + topbar LanguageSwitcher
- `/login`, `/register` — LanguageSwitcher in top-right
- Shared layout components: `LanguageSwitcher`, `ThemeToggle` extracted

### NOT touched this round
- `/admin` route UI (except unused-import cleanup to unblock build)
- `/` landing page
- `/wallet`, `/strategies`, `/copy-trading`, `/atlas-gold`, `/notifications`, `/settings`

### Client portal navigation + language — what was wired
- **DashboardPage.tsx sidebar**: every item uses `<NavLink>` from react-router-dom. Active class is `act` (matches `.nav-i.act` rule in `src/styles/reference.css`). Overview uses `end` prop. No hardcoded active classes.
- **Route mapping**: Overview→/dashboard, Signal Plaza→/strategies, Trade→/copy-trading, Trail Mode→/atlas-gold, Wallet→/wallet, Notifications→/notifications, Settings→/settings. Placeholder items (Portfolio, History, Referrals, Activities, Community) point at `/dashboard` with `// TODO:` comments until their routes exist.
- **Topbar (client shell)**: `<LanguageSwitcher />` injected before the bell icon. All ported classNames preserved verbatim.
- **LanguageSwitcher** lives at `src/components/layout/LanguageSwitcher.tsx` as a named export; consumed by Dashboard, Auth pages, AppShell, Admin.
- **ThemeToggle** extracted to `src/components/layout/ThemeToggle.tsx`.

### Auth pages — LanguageSwitcher added
- `src/pages/Auth/LoginPage.tsx`: `<LanguageSwitcher />` absolutely positioned `top-4 right-4` inside the outer `relative` wrapper.
- `src/pages/Auth/RegisterPage.tsx`: same pattern.

### Build unblock (minimal, no behavior change)
- `src/components/layout/Topbar.tsx`: removed unused imports (`useTranslation`, `cn`, `ThemeToggle`).
- `src/pages/Admin/AdminPage.tsx`: added missing `useLocation`, `useNavigate` from react-router-dom; dropped unused imports and an unread `location` local.

### Verification
- `npm run build` — PASS, 0 errors (tsc -b clean, vite build ~522 ms)
- Playwright @ 1440x900:
  - Login as `trader@tradeverse.io / password` → lands on `/dashboard`
  - Sidebar click→URL change + active class: 6/12 items hit real routes (Signal Plaza, Trade, Trail Mode, Wallet, Notifications, Settings); 6 items (Overview, Portfolio, History, Referrals, Activities, Community) intentionally point at `/dashboard` pending route implementation
  - LanguageSwitcher visible and toggles active state on `/dashboard`, `/login`, `/register`
  - 0 console errors across the session
- Follow-up (not this round): hardcoded strings in DashboardPage / LoginPage / RegisterPage are not yet wired to `t()`, so the VI toggle flips state but does not translate those surfaces. Per spec, ported markup was preserved verbatim this round.

### Commits (this round)
- `refactor(layout): extract LanguageSwitcher + ThemeToggle to shared components`
- `feat(dashboard): NavLink sidebar + LanguageSwitcher in topbar`
- `feat(auth): LanguageSwitcher on login + register pages`
- `fix(admin): restore router imports, drop unused imports to unblock build`

Branch: `feat/frontend` — pushed to origin.

---

## Prior rounds (archived)

### Admin Page — Self-Contained
- Rewrote `src/pages/Admin/AdminPage.tsx` as standalone layout (no AppShell)
- Collapsible sidebar + admin topbar with search, language switcher, notifications bell, back-to-client button
- Route moved out of AppShell in `App.tsx`, still role-guarded via `RequireRole({ role: ['ADMIN', 'MANAGER'] })`
- MSW: admin login credentials added

### Landing Page — Public with Dashboard CTA
- Route `/` remains public (no GuestGuard)
- Authenticated users see "Go to Dashboard" CTA instead of "Sign in"

### i18n Infrastructure
- `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- Config: `src/i18n/index.ts` (localStorage key `tv-lang`)
- Locales: `src/i18n/locales/{en,vi}/common.json`
- Format helpers: `src/lib/format.ts` (locale-aware Intl)

### design.md §25 Internationalization
- Documents stack, key conventions, format helpers, detection order, language switcher locations

### Remaining Pages i18n Wired
- `useTranslation()` added to Strategies, CopyTrading, Wallet, Notifications, Settings, AtlasGold
