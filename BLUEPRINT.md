# Tradeverse 2.0 — Construction Blueprint

> Generated: 2026-04-19
> Objective: Build Tradeverse 2.0, a web-based trading and copy-trading platform
> Base: React 19 + TypeScript + Vite 8 + Tailwind CSS + shadcn/ui + Zustand

---

## Phase 0: Foundation Setup (PR #0)
**Branch:** `core` (app/ worktree)
**Priority:** CRITICAL — All other phases depend on this
**Est. Time:** 1-2 sessions

### Context Brief
The `app/` directory has a bare Vite + React scaffold with only `react` and `react-dom` installed. All other dependencies from AGENTS.md are missing. The design system is fully documented in `design.md` and `Tradeverse-2.0-PRD.md` (1607 lines). We need to install dependencies, configure Tailwind, set up the project structure, and establish the base routing + state architecture before any feature work can begin.

### Steps
1. **Install all required dependencies**
   ```bash
   npm install tailwindcss @tailwindcss/vite
   npm install react-router-dom
   npm install zustand
   npm install @tanstack/react-query
   npm install lucide-react
   npm install clsx tailwind-merge
   npm install class-variance-authority
   ```

2. **Configure Tailwind CSS v4**
   - Create `src/styles/index.css` with `@import "tailwindcss"`
   - Configure `vite.config.ts` with `@tailwindcss/vite` plugin
   - Set up CSS custom properties from `design.md` (colors, spacing, typography)
   - Import Geist and Geist Mono fonts

3. **Set up shadcn/ui**
   - Initialize with `npx shadcn@latest init`
   - Configure `components.json` with correct aliases (`@/components/ui`, `@/lib/utils`)
   - Set base color to `neutral` (matches Vercel black/white aesthetic)

4. **Create project folder structure**
   ```
   src/
   ├── components/
   │   ├── ui/              # shadcn components
   │   └── common/          # Shared components (Layout, Header, Footer)
   ├── pages/               # Route-level pages
   ├── hooks/               # Custom hooks
   ├── stores/              # Zustand stores
   ├── lib/                 # Utilities (cn, api client)
   ├── types/               # TypeScript interfaces
   ├── styles/              # Global styles, Tailwind config
   └── assets/              # Images, fonts
   ```

5. **Set up base routing**
   - Create `src/App.tsx` with `BrowserRouter` + `Routes`
   - Define route constants in `src/lib/routes.ts`
   - Create placeholder page components for all 15 PRD modules
   - Implement `Layout` component with Navigation + Footer shells

6. **Set up Zustand stores**
   - `src/stores/authStore.ts` — JWT, user profile, login/logout
   - `src/stores/uiStore.ts` — theme, sidebar, modals, toasts
   - `src/stores/tradingStore.ts` — positions, orders, market data (stub)

7. **Set up API client**
   - `src/lib/api.ts` — Axios/fetch wrapper with interceptors
   - Base URL from env var (`VITE_API_BASE_URL`)
   - Request interceptor: attach JWT from authStore
   - Response interceptor: handle 401 → logout, refresh token logic

8. **Set up utility libraries**
   - `src/lib/utils.ts` — `cn()` function (clsx + tailwind-merge)
   - `src/lib/formatters.ts` — number, currency, date formatters
   - `src/types/index.ts` — shared TypeScript interfaces

### Verification
- [ ] `npm run dev` starts without errors
- [ ] Tailwind classes render correctly (test with a colored div)
- [ ] React Router navigation works between placeholder pages
- [ ] Zustand store state persists and updates correctly
- [ ] API client interceptors fire on requests
- [ ] All 15 PRD module routes are accessible

### Rollback
- Commit hash before this phase is `HEAD~1` (initial scaffold)
- If broken: `git reset --hard HEAD~1` and retry

---

## Phase 1: Authentication & Onboarding (PR #1)
**Branch:** `features/auth` (features/auth/ worktree)
**Depends on:** Phase 0
**Priority:** HIGH — Blocks all authenticated features
**Est. Time:** 2-3 sessions

### Context Brief
Module 1 of the PRD. Users must be able to log in via email/password or OAuth (Google, Apple, Telegram). JWT stored in localStorage. Registration modal. Form validation with shake animations. This is a self-contained feature that only needs the API client and authStore from Phase 0.

### Steps
1. **Create LoginPage component**
   - `src/pages/LoginPage.tsx`
   - Clean white card centered on screen
   - Email/phone input, password input with show/hide toggle
   - "Login" button (green primary CTA per PRD)
   - "Sign up now!" link → opens registration modal
   - Divider with "or" text
   - OAuth buttons: Google, Apple, Telegram

2. **Create RegistrationModal component**
   - `src/components/auth/RegistrationModal.tsx`
   - Fields: Email, Password, Confirm Password, Terms checkbox
   - "Create Account" button
   - "Already have account? Login" link
   - Form validation with inline errors

3. **Implement form validation**
   - Email format validation
   - Password strength indicator (optional but nice)
   - Confirm password match
   - Terms checkbox required
   - Shake animation on validation failure
   - Error tooltips below fields

4. **Implement OAuth flows**
   - Google OAuth popup (600x700px)
   - Apple Sign-In native modal
   - Telegram OAuth with "Connect" button
   - All flows redirect to `/overview` on success

5. **Implement auth guards**
   - `src/components/auth/ProtectedRoute.tsx`
   - Redirect unauthenticated users to `/login`
   - Store intended URL for post-login redirect

6. **Create auth hooks**
   - `src/hooks/useAuth.ts` — login, logout, register, check auth
   - `src/hooks/useOAuth.ts` — handle OAuth callbacks

### Verification
- [ ] Login form validates correctly (empty fields, invalid email, wrong password)
- [ ] JWT token stored in localStorage after successful login
- [ ] Protected routes redirect to login when unauthenticated
- [ ] OAuth buttons open correct popups/modals
- [ ] Registration modal opens/closes smoothly
- [ ] Shake animation plays on validation errors
- [ ] Mobile responsive (keyboard handling, touch targets)

### Rollback
- Delete `src/pages/LoginPage.tsx`, `src/components/auth/`, `src/hooks/useAuth.ts`
- Reset authStore to initial state

---

## Phase 2: Dashboard Overview (PR #2)
**Branch:** `features/dashboard` (features/dashboard/ worktree)
**Depends on:** Phase 0, Phase 1
**Priority:** HIGH — Main landing page after login
**Est. Time:** 2-3 sessions

### Context Brief
Module 2 of the PRD. The Overview/Dashboard is the first screen users see after login. It displays portfolio summary, recent activity, market overview, and quick actions. Uses the design system from `design.md` (Vercel-inspired black/white with accent colors). Requires authStore for user data.

### Steps
1. **Create OverviewPage component**
   - `src/pages/OverviewPage.tsx`
   - Layout: sidebar navigation + main content area
   - Welcome header with user name
   - Portfolio summary cards (total balance, P&L, available funds)
   - Recent activity feed
   - Market overview section (top movers, indices)
   - Quick action buttons (Trade, Deposit, Withdraw)

2. **Create DashboardLayout component**
   - `src/components/layout/DashboardLayout.tsx`
   - Collapsible sidebar with navigation items
   - Top bar with search, notifications, user avatar
   - Breadcrumb navigation
   - Responsive: sidebar becomes drawer on mobile

3. **Create summary card components**
   - `src/components/dashboard/PortfolioCard.tsx`
   - `src/components/dashboard/ActivityFeed.tsx`
   - `src/components/dashboard/MarketOverview.tsx`
   - Use shadcn/ui Card component as base
   - Implement loading skeleton states

4. **Implement real-time data simulation**
   - Mock API responses for portfolio data
   - Simulate WebSocket updates for market prices
   - Use React Query for caching and refetching

5. **Create navigation sidebar**
   - Navigation items: Overview, Trading, Signals, Wallet, Referral, Community, Settings
   - Active state highlighting
   - Badge indicators for notifications
   - Collapse/expand animation

### Verification
- [ ] Dashboard renders with all sections
- [ ] Sidebar navigation works and highlights active item
- [ ] Portfolio cards show correct mock data
- [ ] Activity feed displays recent transactions
- [ ] Market overview shows price changes with color coding
- [ ] Mobile responsive (sidebar becomes hamburger menu)
- [ ] Loading skeletons appear during data fetch

### Rollback
- Delete `src/pages/OverviewPage.tsx`, `src/components/dashboard/`, `src/components/layout/DashboardLayout.tsx`

---

## Phase 3: Signal Plaza (PR #3)
**Branch:** `features/signals` (create via `scripts/new-feature.sh signals`)
**Depends on:** Phase 0, Phase 1, Phase 2
**Priority:** MEDIUM — Core copy-trading feature
**Est. Time:** 3-4 sessions

### Context Brief
Module 3 of the PRD. Signal Plaza is where users discover and subscribe to trading signals from expert traders. Includes signal cards with performance metrics, trader profiles, subscription flows, and signal detail views. This is the core differentiator of the platform.

### Steps
1. **Create SignalPlazaPage component**
   - `src/pages/SignalPlazaPage.tsx`
   - Grid/list view toggle
   - Filter sidebar (category, performance, risk level, price)
   - Sort dropdown (popularity, performance, newest)
   - Search bar

2. **Create SignalCard component**
   - `src/components/signals/SignalCard.tsx`
   - Trader avatar + name
   - Signal name + description
   - Performance metrics (win rate, ROI, drawdown)
   - Risk level badge (low/medium/high)
   - Price/subscription button
   - Follower count
   - Chart sparkline (optional)

3. **Create SignalDetailPage component**
   - `src/pages/SignalDetailPage.tsx`
   - Full trader profile
   - Detailed performance statistics
   - Historical trades table
   - Subscription tiers
   - Reviews/ratings section
   - Related signals

4. **Implement subscription flow**
   - Subscription modal with tier selection
   - Payment integration (Stripe/PayPal stub)
   - Confirmation screen
   - My Subscriptions page

5. **Create signal management for traders**
   - Create signal form
   - Signal performance dashboard
   - Subscriber management

### Verification
- [ ] Signal cards display correctly in grid and list views
- [ ] Filters and sorting work correctly
- [ ] Signal detail page shows all trader information
- [ ] Subscription flow completes without errors
- [ ] Search finds signals by name, trader, or category
- [ ] Mobile responsive (cards stack, filters become modal)

### Rollback
- Delete `src/pages/SignalPlazaPage.tsx`, `src/pages/SignalDetailPage.tsx`, `src/components/signals/`

---

## Phase 4: Trail Mode (Copy Trading) (PR #4)
**Branch:** `features/trading` (features/trading/ worktree)
**Depends on:** Phase 0, Phase 1, Phase 3
**Priority:** HIGH — Core trading functionality
**Est. Time:** 4-5 sessions

### Context Brief
Module 4 of the PRD. Trail Mode is the copy-trading engine where users automatically replicate trades from signal providers. Includes trade execution, position management, risk controls, and performance tracking. This is the most complex feature and requires careful state management.

### Steps
1. **Create TrailModePage component**
   - `src/pages/TrailModePage.tsx`
   - Active trails list
   - Trail configuration panel
   - Performance summary
   - Risk management controls

2. **Create trail configuration components**
   - `src/components/trading/TrailConfig.tsx`
   - Signal provider selection
   - Investment amount input
   - Risk multiplier slider
   - Stop-loss / take-profit settings
   - Max daily loss limit
   - Confirmation modal

3. **Create position management components**
   - `src/components/trading/PositionList.tsx`
   - Open positions table
   - Position detail modal
   - Close position button
   - P&L display with color coding
   - Position history

4. **Implement trading store**
   - Extend `src/stores/tradingStore.ts`
   - Active positions array
   - Trail configurations
   - Trade history
   - Real-time price updates
   - Order execution simulation

5. **Create trade execution flow**
   - Mock order placement API
   - Order confirmation modal
   - Success/error toasts
   - Trade history logging

6. **Implement risk controls**
   - Daily loss limit enforcement
   - Position size limits
   - Automatic stop-loss execution
   - Margin call warnings

### Verification
- [ ] Trail configuration saves correctly
- [ ] Positions update in real-time with price changes
- [ ] Risk limits prevent oversized trades
- [ ] Stop-loss executes automatically at threshold
- [ ] Trade history shows all executed trades
- [ ] P&L calculations are accurate
- [ ] Mobile responsive (tables scroll horizontally)

### Rollback
- Delete `src/pages/TrailModePage.tsx`, `src/components/trading/`
- Reset tradingStore to initial state

---

## Phase 5: Wallet & Transactions (PR #5)
**Branch:** `features/wallet` (create via `scripts/new-feature.sh wallet`)
**Depends on:** Phase 0, Phase 1, Phase 2
**Priority:** HIGH — Financial operations
**Est. Time:** 3-4 sessions

### Context Brief
Module 5 of the PRD. Wallet management for deposits, withdrawals, and transaction history. Must show balances in multiple currencies, transaction status tracking, and payment method management. Security-critical feature requiring careful validation.

### Steps
1. **Create WalletPage component**
   - `src/pages/WalletPage.tsx`
   - Total balance header
   - Currency breakdown cards
   - Deposit/Withdraw quick actions
   - Transaction history table
   - Payment methods section

2. **Create deposit flow**
   - `src/components/wallet/DepositModal.tsx`
   - Currency selection
   - Amount input with min/max validation
   - Payment method selection (bank, crypto, card)
   - Deposit address generation (mock)
   - Confirmation screen with QR code (mock)

3. **Create withdrawal flow**
   - `src/components/wallet/WithdrawModal.tsx`
   - Currency and amount selection
   - Withdrawal address input
   - Fee display
   - Security verification (2FA stub)
   - Confirmation modal

4. **Create transaction history**
   - `src/components/wallet/TransactionList.tsx`
   - Filter by type (deposit/withdrawal/trade)
   - Filter by date range
   - Status badges (pending/confirmed/failed)
   - Export to CSV (optional)

5. **Implement wallet store**
   - `src/stores/walletStore.ts`
   - Balances per currency
   - Transaction list
   - Pending transactions
   - Payment methods

### Verification
- [ ] Wallet shows correct balances
- [ ] Deposit flow completes all steps
- [ ] Withdrawal validates amount against balance
- [ ] Transaction history displays with correct filters
- [ ] Status badges match transaction state
- [ ] Mobile responsive (modals full-screen, tables scroll)

### Rollback
- Delete `src/pages/WalletPage.tsx`, `src/components/wallet/`
- Reset walletStore to initial state

---

## Phase 6: Referral System (PR #6)
**Branch:** `features/referral` (create via `scripts/new-feature.sh referral`)
**Depends on:** Phase 0, Phase 1
**Priority:** MEDIUM — Growth feature
**Est. Time:** 2-3 sessions

### Context Brief
Module 6 of the PRD. Referral program where users invite friends and earn commissions. Includes referral link generation, referral statistics, commission history, and tiered rewards.

### Steps
1. **Create ReferralPage component**
   - `src/pages/ReferralPage.tsx`
   - Referral link with copy button
   - Social sharing buttons
   - Referral statistics (invited, active, earnings)
   - Commission tier progress
   - Referral history table

2. **Create referral statistics cards**
   - Total invited users
   - Active traders count
   - Total commissions earned
   - Current tier level
   - Next tier progress bar

3. **Implement commission display**
   - Commission history table
   - Filter by time period
   - Export option
   - Real-time commission updates (mock)

4. **Create referral store**
   - `src/stores/referralStore.ts`
   - Referral code
   - Referral list
   - Commission history
   - Tier information

### Verification
- [ ] Referral link generates correctly
- [ ] Copy button copies to clipboard
- [ ] Statistics update when referrals change
- [ ] Commission history shows correct amounts
- [ ] Tier progress bar updates correctly
- [ ] Mobile responsive

### Rollback
- Delete `src/pages/ReferralPage.tsx`, `src/stores/referralStore.ts`

---

## Phase 7: Activities & Notifications (PR #7)
**Branch:** `features/activities` (create via `scripts/new-feature.sh activities`)
**Depends on:** Phase 0, Phase 1, Phase 2
**Priority:** MEDIUM — User engagement
**Est. Time:** 2-3 sessions

### Context Brief
Module 7 of the PRD. Activities page shows user actions, system notifications, and alerts. Includes activity feed, notification center, and alert settings.

### Steps
1. **Create ActivitiesPage component**
   - `src/pages/ActivitiesPage.tsx`
   - Activity feed with filters
   - Notification center
   - Alert settings panel

2. **Create activity feed components**
   - `src/components/activities/ActivityFeed.tsx`
   - Activity items (trade, deposit, withdrawal, subscription)
   - Timestamp and relative time
   - Icon based on activity type
   - Load more pagination

3. **Create notification system**
   - `src/components/activities/NotificationBell.tsx`
   - Dropdown notification panel
   - Unread count badge
   - Mark all as read
   - Notification settings

4. **Implement notification store**
   - `src/stores/notificationStore.ts`
   - Notification list
   - Unread count
   - Push notification simulation (mock)

### Verification
- [ ] Activity feed shows all user actions
- [ ] Notifications display in dropdown
- [ ] Unread badge updates correctly
- [ ] Mark as read works
- [ ] Mobile responsive

### Rollback
- Delete `src/pages/ActivitiesPage.tsx`, `src/components/activities/`

---

## Phase 8: Community (PR #8)
**Branch:** `features/community` (create via `scripts/new-feature.sh community`)
**Depends on:** Phase 0, Phase 1
**Priority:** LOW — Engagement feature
**Est. Time:** 2-3 sessions

### Context Brief
Module 8 of the PRD. Community features including discussion forums, trader profiles, leaderboards, and social features.

### Steps
1. **Create CommunityPage component**
   - `src/pages/CommunityPage.tsx`
   - Discussion topics list
   - Leaderboard
   - Trader profiles
   - Search and filters

2. **Create discussion components**
   - `src/components/community/TopicList.tsx`
   - `src/components/community/TopicDetail.tsx`
   - `src/components/community/CommentThread.tsx`
   - Upvote/downvote
   - Reply threading

3. **Create leaderboard**
   - `src/components/community/Leaderboard.tsx`
   - Top traders by performance
   - Time period filters (daily/weekly/monthly/all-time)
   - User rank highlight

### Verification
- [ ] Topics display with correct metadata
- [ ] Comments thread correctly
- [ ] Leaderboard sorts by selected metric
- [ ] Mobile responsive

### Rollback
- Delete `src/pages/CommunityPage.tsx`, `src/components/community/`

---

## Phase 9: Settings (PR #9)
**Branch:** `features/settings` (create via `scripts/new-feature.sh settings`)
**Depends on:** Phase 0, Phase 1
**Priority:** MEDIUM — User configuration
**Est. Time:** 2-3 sessions

### Context Brief
Module 9 of the PRD. Settings page for user preferences, account management, security settings, and notification preferences.

### Steps
1. **Create SettingsPage component**
   - `src/pages/SettingsPage.tsx`
   - Tabbed interface: Profile, Security, Notifications, Preferences

2. **Create profile settings**
   - Avatar upload
   - Display name edit
   - Email/phone update
   - Bio text area

3. **Create security settings**
   - Password change
   - Two-factor authentication toggle
   - Login history
   - Active sessions

4. **Create notification preferences**
   - Email notification toggles
   - Push notification toggles
   - SMS notification toggles
   - Frequency settings

5. **Create preferences**
   - Language selection
   - Currency display preference
   - Timezone
   - Theme toggle (light/dark/system)

### Verification
- [ ] All settings save correctly
- [ ] Form validation works
- [ ] Theme toggle applies immediately
- [ ] Mobile responsive (tabs become dropdown)

### Rollback
- Delete `src/pages/SettingsPage.tsx`, `src/components/settings/`

---

## Phase 10: Error Handling & Loading States (PR #10)
**Branch:** `core` (app/ worktree)
**Depends on:** All previous phases
**Priority:** HIGH — Polishing
**Est. Time:** 1-2 sessions

### Context Brief
Modules 10-11 of the PRD. Global error boundaries, 404 page, loading skeletons, and toast notifications. These must be consistent across all pages.

### Steps
1. **Create error boundary**
   - `src/components/common/ErrorBoundary.tsx`
   - Catch React errors
   - Display friendly error message
   - Reload button
   - Error reporting (mock)

2. **Create 404 page**
   - `src/pages/NotFoundPage.tsx`
   - Illustration
   - "Go home" button
   - Search suggestion

3. **Create loading skeletons**
   - `src/components/common/Skeleton.tsx`
   - Card skeleton
   - Table skeleton
   - Chart skeleton
   - Profile skeleton

4. **Create toast notification system**
   - `src/components/common/Toast.tsx`
   - Success, error, warning, info variants
   - Auto-dismiss with progress bar
   - Stack multiple toasts
   - Position: top-right (desktop), top (mobile)

5. **Implement global error handling**
   - API error toasts
   - Network error detection
   - Retry logic
   - Offline indicator

### Verification
- [ ] Error boundary catches errors without crashing app
- [ ] 404 page shows for unknown routes
- [ ] Skeletons match component shapes
- [ ] Toasts display and auto-dismiss
- [ ] Multiple toasts stack correctly
- [ ] Mobile responsive

### Rollback
- Revert changes to `src/App.tsx` (remove ErrorBoundary wrapper)
- Delete `src/components/common/ErrorBoundary.tsx`, `src/pages/NotFoundPage.tsx`

---

## Phase 11: Responsive Design & Accessibility (PR #11)
**Branch:** `core` (app/ worktree)
**Depends on:** All previous phases
**Priority:** HIGH — Production readiness
**Est. Time:** 2-3 sessions

### Context Brief
Modules 12-13 of the PRD. Ensure the app works on all screen sizes and meets WCAG 2.1 AA standards. This is a cross-cutting concern that touches all components.

### Steps
1. **Audit responsive breakpoints**
   - Mobile: < 768px
   - Tablet: 768px - 1024px
   - Desktop: > 1024px
   - Test all pages at each breakpoint

2. **Fix mobile issues**
   - Sidebar becomes drawer
   - Tables become cards or horizontal scroll
   - Modals become full-screen
   - Touch targets >= 44px
   - Font sizes readable on small screens

3. **Implement accessibility**
   - Semantic HTML (header, nav, main, footer, article)
   - ARIA labels on interactive elements
   - Keyboard navigation (Tab, Enter, Escape)
   - Focus indicators visible
   - Color contrast >= 4.5:1
   - Screen reader tested (manual)

4. **Add accessibility utilities**
   - Skip to content link
   - Reduced motion support (`prefers-reduced-motion`)
   - High contrast mode support

### Verification
- [ ] All pages usable on 375px width
   - [ ] All pages usable on 768px width
   - [ ] All pages usable on 1440px width
   - [ ] Keyboard navigation works throughout
   - [ ] Focus indicators visible
   - [ ] ARIA labels present on all interactive elements
   - [ ] Color contrast passes WCAG AA

### Rollback
- Revert CSS changes, remove ARIA attributes

---

## Phase 12: Performance Optimization (PR #12)
**Branch:** `core` (app/ worktree)
**Depends on:** All previous phases
**Priority:** MEDIUM — Production readiness
**Est. Time:** 2-3 sessions

### Context Brief
Module 14 of the PRD. Optimize bundle size, loading performance, and runtime performance. Use React.lazy, code splitting, and memoization.

### Steps
1. **Implement code splitting**
   - Use `React.lazy()` for all page components
   - Create loading fallbacks for each route
   - Verify chunks in build output

2. **Optimize images**
   - Convert PNGs to WebP where possible
   - Implement lazy loading for images
   - Use appropriate image sizes

3. **Add performance monitoring**
   - Web Vitals tracking (LCP, FID, CLS)
   - Bundle size analysis
   - Lighthouse CI (optional)

4. **Implement caching**
   - Service worker for offline support (optional)
   - API response caching with React Query
   - Image caching strategies

5. **Optimize re-renders**
   - Audit with React DevTools Profiler
   - Add `React.memo` where beneficial
   - Optimize `useEffect` dependencies
   - Use `useMemo` for expensive calculations

### Verification
- [ ] Lighthouse score >= 90
   - [ ] Bundle size < 500KB initial
   - [ ] LCP < 2.5s
   - [ ] No unnecessary re-renders in Profiler
   - [ ] Code splitting works (separate chunks loaded)

### Rollback
- Revert `React.lazy()` changes, return to static imports

---

## Phase 13: Final Integration & Testing (PR #13)
**Branch:** `core` (app/ worktree)
**Depends on:** All previous phases
**Priority:** CRITICAL — Release readiness
**Est. Time:** 2-3 sessions

### Context Brief
Final phase: merge all feature branches into `core`, run full test suite, fix integration issues, and prepare for deployment.

### Steps
1. **Merge all feature branches**
   ```bash
   cd app/
   git merge features/auth
   git merge features/dashboard
   git merge features/signals
   git merge features/trading
   git merge features/wallet
   git merge features/referral
   git merge features/activities
   git merge features/community
   git merge features/settings
   ```

2. **Resolve merge conflicts**
   - Check for conflicting imports
   - Verify route definitions don't clash
   - Ensure store slices compose correctly

3. **Run integration tests**
   - Full user flow: register → login → browse signals → subscribe → trade → withdraw
   - Error scenarios: invalid login, insufficient funds, network errors
   - Cross-browser testing (Chrome, Firefox, Safari)

4. **Final polish**
   - Remove console.log statements
   - Verify all TODO comments are resolved
   - Check for unused imports/variables
   - Run linter and fix all warnings

5. **Build verification**
   ```bash
   npm run build
   npm run preview
   ```
   - Verify build succeeds without errors
   - Check build output size
   - Test production build locally

6. **Documentation**
   - Update README.md with setup instructions
   - Document environment variables
   - Add deployment guide

### Verification
- [ ] All feature branches merged cleanly
   - [ ] No merge conflicts remaining
   - [ ] Full user flow works end-to-end
   - [ ] Build succeeds
   - [ ] No console errors in production build
   - [ ] README updated

### Rollback
- Keep feature branches until deployment confirmed
- If critical issue: `git reset --hard` to pre-merge commit

---

## Parallel Execution Opportunities

These phases can be worked on in parallel by different agents:

| Group | Phases | Reason |
|-------|--------|--------|
| A | Phase 1 (Auth) + Phase 6 (Referral) | Both self-contained, only need Phase 0 |
| B | Phase 2 (Dashboard) + Phase 7 (Activities) | Both need auth, no interdependency |
| C | Phase 3 (Signals) + Phase 8 (Community) | Both content-heavy, independent |
| D | Phase 4 (Trading) + Phase 5 (Wallet) | Both financial, but separate domains |
| E | Phase 9 (Settings) + Phase 10 (Error) | Both cross-cutting, can be done anytime after Phase 1 |

**Optimal parallel groups after Phase 0:**
- **Session 1:** Phase 0 (Foundation) — MUST complete first
- **Session 2-3:** Groups A, B, C in parallel (3 agents)
- **Session 4-5:** Groups D, E in parallel (2 agents)
- **Session 6:** Phase 11 (Responsive) + Phase 12 (Performance)
- **Session 7:** Phase 13 (Integration)

---

## Model Tier Recommendations

| Phase | Model Tier | Reason |
|-------|-----------|--------|
| Phase 0 | Strongest | Foundation affects everything |
| Phase 1 | Strongest | Auth is security-critical |
| Phase 2 | Strong | Complex UI with many components |
| Phase 3 | Strong | Complex data visualization |
| Phase 4 | Strongest | Most complex business logic |
| Phase 5 | Strong | Financial calculations must be exact |
| Phase 6-9 | Standard | Well-defined CRUD features |
| Phase 10-12 | Standard | Polishing and optimization |
| Phase 13 | Strongest | Integration requires full context |

---

## Branch Workflow Rules

1. **Feature branches** live in `features/<name>/` worktrees
2. **Core branch** in `app/` is the integration branch
3. Each phase gets its own PR from its feature branch to `core`
4. PRs require: build passes, no lint errors, manual verification checklist complete
5. After merge, feature worktree can be removed via `scripts/remove-feature.sh <name>`
6. Keep feature branches until Phase 13 complete (rollback safety)

---

## CI Policy

- Run `npm run lint` on every PR
- Run `npm run build` on every PR
- Block merge if either fails
- Optional: Run Lighthouse CI on PR preview deployments

---

## Rollback Strategy

| Scenario | Action |
|----------|--------|
| Single feature broken | Revert merge commit in `core`, keep feature branch for fix |
| Foundation broken | `git reset --hard HEAD~1` in `app/`, reinstall dependencies |
| Integration failed | Reset `core` to pre-merge commit, fix feature branch, re-merge |
| Production bug | Hotfix branch from `core`, merge back, redeploy |

---

## Environment Variables

```bash
VITE_API_BASE_URL=https://api.tradeverse.example.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_APPLE_CLIENT_ID=your-apple-client-id
VITE_TELEGRAM_BOT_NAME=your-telegram-bot
```

---

## Notes for Continuing Agents

1. **Always read AGENTS.md first** — it contains the tech stack and conventions
2. **Reference design.md for all visual decisions** — colors, typography, spacing
3. **Use the git worktree structure** — develop features in isolated worktrees
4. **Run `scripts/status.sh`** to see current worktree state
5. **Follow the verification checklist** in each phase before marking complete
6. **Use Zustand for global state** — don't prop-drill
7. **Use React Query for server state** — don't manage API data in Zustand
8. **Test on mobile** — this is a trading app, users will use it on phones
9. **Keep components small** — single responsibility, composition over inheritance
10. **When in doubt, check the PRD** — Tradeverse-2.0-PRD.md has the final word on behavior

---

*End of Blueprint*
