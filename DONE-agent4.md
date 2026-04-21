# DONE — Agent 4 (Frontend)

## Round: Chinese (zh) locale + full Dashboard/Auth i18n coverage

### Scope (this round)
- i18n infra: swap second locale from Vietnamese (vi) to Simplified Chinese (zh)
- `/dashboard` — every user-facing string keyed through `t()` (dashboard namespace)
- `/login`, `/register` — every user-facing string keyed through `t()` (auth namespace)
- LanguageSwitcher: `en` ↔ `zh` (中文)

### NOT touched this round
- `/admin` UI (except the inline VI→ZH literal swap on the admin topbar language button)
- `/`, `/wallet`, `/strategies`, `/copy-trading`, `/atlas-gold`, `/notifications`, `/settings`

### i18n infrastructure
- Deleted `src/i18n/locales/vi/`; created `src/i18n/locales/zh/` (common.json translated to Simplified Chinese)
- `src/i18n/index.ts`:
  - `supportedLngs: ['en', 'zh']`, `fallbackLng: 'en'`
  - Registered new namespaces: `ns: ['common', 'dashboard', 'auth']`
  - Imported `{en,zh}/dashboard.json` and `{en,zh}/auth.json` into `resources`
- `LanguageSwitcher`: ZH option uses `{ code: 'zh', label: '中文', short: 'ZH' }`; uses `i18n.resolvedLanguage` for active-state; persists to `localStorage['tv-lang']`

### Dashboard i18n coverage (DashboardPage.tsx)
58+ `t()` calls across: sidebar sections + nav + footer, topbar title/breadcrumb/searchPlaceholder, hero (sessionStatus/greeting/tagline/taglineAccent/summary/stats.*), KPI labels + badges (mtd/invested/available/daysLeft with interpolation + Intl formatters), Portfolio performance (title/subtitle/ranges), Recent activity (title/viewAll + 6 item types with interpolation), Active positions (title/accent/viewAll/labels/actions/status/followers for all three cards).
Currency rendered via `formatCurrency()`, percent via `formatPercent()` from `src/lib/format.ts`.

### Auth i18n coverage
- LoginPage: 11 t() calls — title, subtitle, email/password labels + placeholders, forgot, submit, divider, noAccount + signUpLink
- RegisterPage: 13 t() calls — title, subtitle, name/email/password/confirmPassword labels + placeholders, submit, divider, haveAccount + signInLink
- New keys added symmetrically in en + zh: `login.signUpLink`, `register.signInLink`, `login.noAccount`, `register.haveAccount`

### Verification
- `npm run build` — PASS, 0 errors (tsc -b clean, vite build ~500 ms)
- Playwright @ 1440x900 (after namespace registration fix):
  - Login: EN ↔ ZH toggles render correctly (欢迎回来 / 邮箱 / 密码 / 登录 / 忘记密码？/ 或使用以下方式 / 还没有账户？/ 注册)
  - Dashboard: every targeted surface renders ZH correctly — sidebar sections + all 12 nav items, 高级会员 footer, 概览/门户 breadcrumb, 搜索市场、信号、订单…… placeholder, hero greeting + summary, all 4 KPI labels + 4 badges, 投资组合表现/最近 30 天/30天·90天·1年, 最近动态 + 6 activity item types, 活跃 仓位 + INVESTED/P/L/WIN + 关闭/追加资金 + 活跃/筹资中 + `{count} 位关注者` for all three position cards
  - Console: 0 errors, 0 missingKey warnings
- Screenshots (not committed):
  - `.playwright-mcp/login-en.png`, `.playwright-mcp/login-zh.png`
  - `.playwright-mcp/dashboard-en.png`, `.playwright-mcp/dashboard-zh.png`

### Known follow-ups (not this round)
- Relative time strings ("2 hours ago", "5 hours ago", "Yesterday") are still English because they live in mock data, not in DashboardPage JSX. Localize alongside a real data source.
- Live language-switch click persists to localStorage but may require a reload in some environments; `i18n.resolvedLanguage` is now the source of truth for active state.
- Remaining routes (wallet, strategies, copy-trading, etc.) have `useTranslation()` imports from a prior round but still carry English literals.

### Commits (this round)
- `refactor(i18n): rename vi locale to zh (Simplified Chinese)`
- `feat(i18n): seed dashboard + auth namespaces in en + zh`
- `feat(dashboard): wire every string through t() with Intl formatters`
- `feat(auth): wire login + register strings through t()`
- `docs: update DONE-agent4.md with zh + Dashboard/Auth coverage`

Branch: `feat/frontend` — pushed to origin.

---

## Prior rounds (archived)

### Client portal nav + language (previous round)
- NavLink sidebar on DashboardPage + LanguageSwitcher in client topbar
- LanguageSwitcher on Login + Register
- LanguageSwitcher + ThemeToggle extracted to shared components
- Admin build fix (router imports)

### Admin Page — Self-Contained
- Standalone layout (no AppShell), collapsible sidebar, admin topbar, role-guarded, MSW admin creds

### Landing Page — Public with Dashboard CTA
- Public route `/`, authed-user Dashboard CTA

### i18n Infrastructure (initial)
- i18next + react-i18next + browser-languagedetector
- `src/i18n/index.ts`, locales directory, format helpers

### design.md §25 Internationalization
