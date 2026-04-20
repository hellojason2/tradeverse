# BEHAVIOR.md — Tradeverse User-Feedback Pattern Guide

**Audience:** AI agents (Claude Code, Cursor, etc.) building Tradeverse features.
**Purpose:** Codify how every user-facing surface communicates state, errors, progress, and corrections. Before building any feature that touches a user, **read this file and apply the matching pattern**.
**Rule of thumb:** Users should never be confused about what is happening, why something is disabled, or whose fault an error is. Silence is failure.

---

## 0. The Three Fundamental Questions

Every user-facing interaction must answer at least one of these:

1. **"Can I do this?"** — affordance state (enabled/disabled, available/locked)
2. **"What happened?"** — result state (success/failure/pending)
3. **"What do I do next?"** — recovery path (always present on errors)

If your UI doesn't answer any of these for a given surface, you haven't finished building it.

---

## 1. Error Taxonomy — Whose Fault Is It?

Every error message must be classified into one of four categories. **The user needs to know which one they're seeing so they react correctly.**

| Category | Code Prefix | Example | User's perception | User's action |
|---|---|---|---|---|
| **USER_INPUT** | `U_` | Entered $1,000 when min is $2,000 | "I made a mistake" | Fix input, retry |
| **USER_STATE** | `S_` | KYC not verified; insufficient balance | "My account isn't ready" | Complete a prerequisite, then retry |
| **BUSINESS_RULE** | `B_` | Strategy already has max followers; fundraising window closed | "The system is saying no" | Wait, choose different option, or accept |
| **SYSTEM_ERROR** | `E_` | Database connection lost; CopyPro circuit breaker open | "Something is broken" | Wait and retry, or contact support |

**Rendering rules:**
- `USER_INPUT` → **inline** next to the field, red/orange tone, form stays open
- `USER_STATE` → **modal or banner** explaining what's needed, with a CTA to resolve
- `BUSINESS_RULE` → **toast or inline**, neutral tone (this is expected behavior, not an error)
- `SYSTEM_ERROR` → **toast + log to Sentry + log trace ID**. Show user a support link with the trace ID prefilled.

**Critical:** users seeing a `SYSTEM_ERROR` must see a trace ID so support can debug. Users seeing `USER_INPUT` or `USER_STATE` must NOT see a trace ID — it's their issue, not ours.

---

## 2. The Canonical Error Response Shape

Every API error returns this exact structure. Frontend uses the `code` to look up the right UI pattern.

```json
{
  "error": {
    "code": "U_RISK_CAPITAL_BELOW_MIN",
    "category": "USER_INPUT",
    "severity": "blocker",
    "title": "Below minimum investment",
    "message": "This strategy requires at least $2,000 to subscribe.",
    "details": {
      "entered": 1000,
      "required": 2000,
      "currency": "USDT"
    },
    "remediation": {
      "action": "increase_amount",
      "cta_label": "Add funds",
      "cta_url": "/wallet/deposit"
    },
    "trace_id": null,
    "docs_url": "/help/minimum-investment"
  }
}
```

| Field | Always present? | Purpose |
|---|---|---|
| `code` | ✅ | Machine-readable identifier. Frontend maps to specific UI. Stable across releases. |
| `category` | ✅ | One of the four from §1. |
| `severity` | ✅ | `info` / `warning` / `blocker` / `critical` |
| `title` | ✅ | Short headline (≤ 6 words) |
| `message` | ✅ | One-sentence explanation in plain English |
| `details` | optional | Structured context for rendering (numbers, dates, names) |
| `remediation` | ✅ for blockers | What the user should do next |
| `trace_id` | only SYSTEM_ERROR | Sentry/log trace ID, shown to user |
| `docs_url` | optional | Link to help center article |

---

## 3. Affordance State (Buttons, Subscribe Boxes, Form Fields)

### The "grayed out" pattern — never silent

**Rule: disabled controls must explain themselves.** Never show a grayed-out button without a tooltip, inline text, or badge explaining why.

### Example: Subscribe box for strategies

User has $1,000 available. Strategy X minimum is $2,000.

**Wrong:**
```
[Subscribe]  ← grayed out, no explanation
```

**Right:**
```
┌────────────────────────────────────────────────────┐
│ ⚠  Below minimum — requires $2,000                 │
│    You have $1,000. Need $1,000 more.              │
│                                                    │
│ [Subscribe]  (disabled)      [Add funds →]         │
└────────────────────────────────────────────────────┘
```

### Canonical affordance states

Every interactive control has these possible states. The frontend must render each correctly:

| State | Trigger | Visual | Message shown |
|---|---|---|---|
| `enabled` | All prerequisites met | Standard button | — |
| `disabled_gated` | Missing prerequisite (KYC, balance, etc.) | Grayed out + lock icon | "Complete KYC to enable" (tooltip + inline) |
| `disabled_rule` | Business rule blocks it | Grayed out + info icon | "Strategy is full (500/500 followers)" |
| `disabled_loading` | Pending state (API in flight) | Grayed out + spinner | "Processing…" |
| `disabled_cooldown` | Time-based cooldown active | Grayed out + timer | "Try again in 5:42" |
| `enabled_with_warning` | Action possible but risky | Normal button + warning badge | "Position size exceeds recommended" |
| `destructive` | Irreversible action | Red button + confirm modal required | "This will close all your open positions" |

### Agent rule when building any button

Before you write `<button disabled>`, ask:
1. **Why** is it disabled? (Pull the reason from the backend if possible, don't hardcode.)
2. **What** should the user do to enable it?
3. **Is there a secondary CTA** that helps them get there? (e.g., "Add funds" next to a disabled subscribe button)

If you can't answer all three, stop and design the state properly.

---

## 4. Notification Channels

Tradeverse communicates with users through **five channels**. Each has a distinct purpose. Never use the wrong channel.

| Channel | Purpose | Examples | Persists? |
|---|---|---|---|
| **Toast** | Transient feedback on user action | "Trade closed (+$250)", "Settings saved" | No (auto-dismiss 4s) |
| **Modal/Pop-up** | Requires attention or decision | "Confirm withdrawal", "Equity protector triggered" | Until dismissed |
| **Inline** | Context-bound feedback | Field validation errors | While field is visible |
| **Banner** | Account-wide state | "KYC required before withdrawals", "Service degraded" | Until condition resolves |
| **NotificationCenter** | Historical record | Trade closes, deposits, referral earnings | Indefinite (user archives) |

### Decision matrix: which channel to use

```
Was this a direct response to the user's action?
├── Yes → Is it dismissible?
│         ├── Yes (informational) → TOAST
│         └── No (needs decision) → MODAL
│
└── No (async or state-driven) → Is it time-sensitive?
          ├── Yes (next 60s matters) → MODAL (interrupt) or TOAST (info only)
          └── No → Does it require recurring reference?
                    ├── Yes → BANNER (account-level) or NotificationCenter (event)
                    └── No → NotificationCenter
```

### Examples mapped

| Event | Channel | Reason |
|---|---|---|
| User clicks "Save profile", request succeeds | Toast | Direct response, transient |
| User tries to subscribe with $1,000 to $2k min strategy | Inline + disabled button | Form-bound validation |
| Equity protector triggers auto-close | Modal + NotificationCenter | Time-sensitive decision ("Review closed trades") + historical record |
| KYC not verified, user tries to withdraw | Modal with "Verify KYC" CTA | Must complete prerequisite |
| System enters maintenance window | Banner (platform-wide) | Account-wide state |
| A trade closes with profit | Toast + NotificationCenter | Ambient feedback + record |
| User's referral earns first commission | NotificationCenter | Event worth retaining, not urgent |
| CopyPro circuit breaker tripped, subscriptions paused | Banner (account-scoped if their copy affected) | Service state |
| Wrong password on login | Inline on password field | Form-bound |
| 2FA code required | Modal | Required decision |

---

## 5. The "Why Is This Disabled?" Catalog

This is the **single source of truth** for every gating condition in Tradeverse. When building a feature that has a gated state, add to this catalog.

### Subscribe to strategy

| Code | When | User message | CTA |
|---|---|---|---|
| `U_RISK_CAPITAL_BELOW_MIN` | Amount < strategy.min_risk_capital | "This strategy requires at least $X" | "Add funds" |
| `U_RISK_CAPITAL_ABOVE_MAX` | Amount > strategy.max_risk_capital | "Maximum per subscriber is $X" | "Reduce amount" |
| `S_INSUFFICIENT_BALANCE` | user.available < risk_capital | "You have $X available. Need $Y more." | "Deposit" |
| `S_KYC_NOT_VERIFIED` | user.kyc_status != VERIFIED and strategy requires KYC | "Complete identity verification first" | "Verify now" |
| `S_NO_MT5_ACCOUNT` | user has no LINKED MT5Account | "Link a broker account to subscribe" | "Link account" |
| `S_MT5_ACCOUNT_DEGRADED` | user.active_mt5.status != LINKED | "Your broker connection needs attention" | "Fix connection" |
| `B_STRATEGY_NOT_ACTIVE` | strategy.status != ACTIVE | "Strategy is paused by the trader" | (no action) |
| `B_STRATEGY_FULL` | strategy.follower_count >= strategy.max_followers | "Strategy has reached its follower limit" | "Notify me if a slot opens" |
| `B_DUPLICATE_SUBSCRIPTION` | user already has active CopyRelation to this strategy | "You're already subscribed" | "View position" |
| `B_INSUFFICIENT_COVERAGE` | Atlas Gold strategy, insurance pool short | "Insurance pool is fully allocated" | "Try again later" or "Subscribe with partial coverage" |
| `B_FUNDRAISING_CLOSED` | strategy.status = FUNDRAISING and target missed | "Fundraising window has closed" | (view other strategies) |

### Withdraw

| Code | When | User message | CTA |
|---|---|---|---|
| `U_AMOUNT_BELOW_MIN` | amount < $10 | "Minimum withdrawal is $10" | — |
| `U_AMOUNT_ABOVE_DAILY_LIMIT` | sum(24h) + amount > daily_limit | "Daily limit is $X. You've used $Y today." | "Schedule for tomorrow" |
| `U_INVALID_ADDRESS` | address fails network regex | "This doesn't look like a valid TRC20 address" | — |
| `S_KYC_REQUIRED_FOR_AMOUNT` | amount > $1000 and kyc != VERIFIED | "Withdrawals over $1,000 require KYC verification" | "Verify now" |
| `S_2FA_REQUIRED` | 2FA code missing or wrong | "Enter your 2FA code to confirm" | — |
| `S_INSUFFICIENT_AVAILABLE` | locked_balance > 0 blocks withdrawal | "You have $X locked in active strategies. Available: $Y" | "View locked funds" |
| `B_NEW_ADDRESS_REQUIRES_CONFIRMATION` | address not in whitelist | "We sent a confirmation link to your email" | — |
| `B_PENDING_APPROVAL` | amount > $1000 and flagged for manual review | "Your withdrawal is pending admin review" | "View status" |

### Enroll in Trail Mode

| Code | When | User message | CTA |
|---|---|---|---|
| `S_KYC_NOT_VERIFIED` | user.kyc != VERIFIED | "Complete KYC to start your challenge" | "Verify now" |
| `S_INSUFFICIENT_BALANCE` | available < $99.99 | "Need $99.99 USDT to enroll" | "Deposit" |
| `B_ACTIVE_CHALLENGE_EXISTS` | existing challenge in ACTIVE/LEVEL_1_PASSED | "You already have an active challenge" | "View challenge" |
| `B_IN_COOLDOWN` | failed/expired within 7 days | "Try again in X days" | — |

### Request Prop Firm payout

| Code | When | User message | CTA |
|---|---|---|---|
| `B_ACCOUNT_TOO_YOUNG` | account age < 30 days | "Available 30 days after your first trade" | — |
| `B_CYCLE_NOT_ELAPSED` | last_payout < 14 days ago | "Next payout available in X days" | — |
| `B_AMOUNT_BELOW_MIN` | amount < $100 | "Minimum payout is $100" | — |
| `B_PENDING_REVIEW` | amount > $5,000, manual review | "Your payout is pending admin review" | "View status" |

### Link MT5 account

| Code | When | User message | CTA |
|---|---|---|---|
| `U_INVALID_CREDENTIALS` | mtapi /Connect returns auth failure | "Login or password is incorrect" | "Try again" |
| `U_SERVER_NOT_FOUND` | broker server unknown to mtapi | "We couldn't find this broker server" | "Choose from list" |
| `B_BROKER_BLOCKS_OUR_IP` | Monaxa / PUPrime from Hostinger IP | "This broker blocks our server region. Use FXVM/BeeksFX VPS as a bridge." | "Learn more" |
| `E_MTAPI_UNREACHABLE` | mtapi.io unreachable | "Our broker gateway is temporarily unavailable" | "Retry in a few minutes" |

---

## 6. The Three Progressive-Disclosure Layers

Every error or gated state must support **progressive disclosure**:

1. **Layer 1 — Headline (≤ 6 words):** Grabs attention. Example: "Below minimum investment"
2. **Layer 2 — One-sentence explanation:** Enough context to understand. "This strategy requires $2,000; you entered $1,000."
3. **Layer 3 — Expanded details (click to open):** Full context, relevant policy, link to docs. Opens inline or in a side panel.

**Don't dump everything at once.** Agents default to showing Layer 1 + 2 and hiding Layer 3 behind "Learn more" or a chevron.

---

## 7. Async Feedback — Loading, Pending, Long-Running

Any action taking > 300ms must show progress. Anything > 3 seconds must show an **explanation**.

| Duration | UI |
|---|---|
| < 300ms | No indicator needed (feels instant) |
| 300ms – 2s | Spinner or skeleton on the affected area |
| 2s – 10s | Spinner + "Processing..." text |
| 10s – 60s | Progress bar if possible, otherwise "This is taking longer than usual…" toast |
| > 60s | Mark as background task + NotificationCenter entry when complete |

### Optimistic UI — when to use

Safe for:
- Chat messages (show sent, update to "delivered" when server confirms)
- Profile edits (revert on failure with "Couldn't save — try again" toast)
- Non-destructive toggles

**Never optimistic for:**
- Subscriptions, withdrawals, deposits, any money-moving action
- Trade placement or close
- Account status changes
- Anything with a ledger side-effect

For money-touching actions, always show explicit pending state.

---

## 8. The "What Just Happened?" Rule for Background Events

Events initiated by the system (not the user) must be narrated clearly:

### Equity protector triggers auto-close

```
┌────────────────────────────────────────────────────────────┐
│ 🛡  Equity Protector activated                             │
│                                                            │
│ We closed your positions in "Atlas Gold Momentum" because │
│ drawdown reached 15% (your configured cap).               │
│                                                            │
│ • Closed 3 positions at market                            │
│ • Realized loss: -$147.50                                 │
│ • Remaining balance: $852.50                              │
│                                                            │
│ [Review closed trades]    [Adjust risk settings]          │
└────────────────────────────────────────────────────────────┘
```

Contains: **what happened, why, what the consequence was, what to do next.**

### Margin warning

```
┌────────────────────────────────────────────────────────────┐
│ ⚠  Margin level is low (148%)                              │
│                                                            │
│ If your margin drops below 110%, the Equity Protector     │
│ will close your positions automatically.                  │
│                                                            │
│ [Add funds]    [Reduce position]    [Dismiss for 1 hour]  │
└────────────────────────────────────────────────────────────┘
```

### CopyPro service degraded

Banner at top of app:
```
🔧 Copy engine is in maintenance mode. New subscriptions
   are paused. Existing copies continue normally.
   [Status page →]
```

---

## 9. Confirmation Patterns

### When to require confirmation

| Action | Confirmation |
|---|---|
| Subscribe to strategy | Modal with summary (amount, lot mode, drawdown cap) |
| Unsubscribe from strategy (open positions exist) | Modal: "This will close N open positions" |
| Withdraw funds | Modal + 2FA |
| Cancel Trail Mode challenge | Modal ("You will forfeit your $99.99 subscription") |
| Change 2FA device | Modal + current 2FA |
| Close Prop Firm account voluntarily | Modal with financial summary |
| Delete referral code (regenerate) | Simple confirm ("Your old code will stop working") |
| Leave a strategy room in chat | Toast-level undo (`[Undo]`), no modal |

### The modal template

```
┌────────────────────────────────────────────────┐
│ {Headline — what will happen}                  │
│                                                │
│ {Body — specific consequences}                 │
│                                                │
│ {Summary if applicable (amounts, counts)}      │
│                                                │
│ {Undo timeline — "You have 10 seconds to       │
│  cancel", if applicable}                       │
│                                                │
│             [Cancel]    [Confirm]              │
└────────────────────────────────────────────────┘
```

Destructive actions: "Confirm" button is red, requires 1-second delay before becoming clickable (prevents rage-clicks).

---

## 10. Empty States

Every list, table, or feed has an empty state. **Empty ≠ broken.** Tell the user what would fill it and how to get started.

### Structure

```
┌────────────────────────────────────────────────┐
│           {illustration or icon}               │
│                                                │
│            {Headline: what's here}             │
│                                                │
│    {One-sentence description of what           │
│     will appear when populated}                │
│                                                │
│              [Primary CTA]                     │
└────────────────────────────────────────────────┘
```

### Examples

| Surface | Empty message | CTA |
|---|---|---|
| Active subscriptions | "You're not following any strategies yet. Browse Signal Plaza to get started." | "Browse strategies" |
| Trade history | "No closed trades yet. Your results will appear here once you've been copying trades." | (no CTA) |
| Referrals list | "Share your code to start earning. Get 20% of your referrals' platform fees." | "Copy referral link" |
| NotificationCenter | "You're all caught up." | (no CTA) |
| Open positions | "No open positions. Subscribe to a strategy to start." | "Browse strategies" |

---

## 11. Form Field Standards

| Field type | Standard behavior |
|---|---|
| **Amount (USDT)** | Right-aligned, currency suffix, 2 decimal places, debounced validation (300ms), inline min/max hint |
| **Email** | Lowercase as-you-type, RFC 5322 validate on blur, not during typing |
| **Password** | Strength meter (weak/medium/strong), policy checklist below field (all rules from PRD §3.3) |
| **2FA code** | 6-digit numeric, auto-submit on 6th digit, auto-focus on mount |
| **Broker address** | Network-specific regex validate on blur, clear "This is a TRC20 address" confirmation |
| **Broker credentials** | Password field masks, "show" toggle, "test connection" button before save |
| **Referral code** | Check availability as user types (debounced 500ms), green check / red X inline |

### Validation timing

- **On blur:** email format, address format, referral code uniqueness
- **On submit:** anything requiring a backend round-trip
- **As-you-type (debounced):** amount limits, password strength, balance sufficiency
- **Never:** block typing mid-field (e.g., don't prevent entering $10,000 if max is $5,000 — let them type, then show the error on blur)

---

## 12. Chat-Specific (Mimity) Behavior

| Scenario | Behavior |
|---|---|
| User posts profanity (filtered channel) | Inline warning before send: "This message may violate community guidelines. Edit or post anyway?" |
| User exceeds rate limit (10/min) | Toast: "Slow down — you can post again in X seconds" + input disabled with timer |
| Message gets 3 reports (auto-hide) | Author sees: "Your message was reported and is under review" (inline replacement of their message) |
| User is muted | Input field replaced with: "You're muted until {timestamp}. [Appeal →]" |
| Strategy room: follower unsubscribes | Automatically removed from room, toast: "You've left {strategy name}'s room" |
| DM request received | NotificationCenter + inbox badge; NOT a modal (not urgent enough) |

---

## 13. Mobile vs. Desktop Differences

| Pattern | Desktop | Mobile |
|---|---|---|
| Toast position | Bottom-right | Top (safer from thumb zone) |
| Modal | Centered overlay | Full-screen sheet from bottom |
| Tooltip on disabled button | Hover | Tap to reveal (with haptic if available) |
| Inline validation | Right of field | Below field |
| Destructive confirm | 1-second delay on red button | 1-second delay + haptic feedback |

Agents: on mobile, treat modal dialogs as **full-screen sheets** and drop non-essential info to preserve the primary CTA above the fold.

---

## 14. Agent Build Rules (How to Apply This File)

When building any new feature:

### Step 1 — Classify the interaction
Ask:
- Is there a gated state? → use §3 (Affordance State)
- Is there async work? → use §7 (Async Feedback)
- Is there an error? → classify it via §1 (Error Taxonomy), return shape from §2
- Is the system doing something the user didn't initiate? → use §8 (What Just Happened?)

### Step 2 — Check the catalog (§5)
If the gating condition already has a code in §5, use it. If it's new, ADD it to §5 as part of your PR. Don't invent one-off error codes.

### Step 3 — Pick the channel (§4)
Use the decision matrix. Don't default to toast for everything.

### Step 4 — Write the message at all three layers (§6)
Always Layer 1 + Layer 2 minimum. Layer 3 optional but recommended.

### Step 5 — Handle the empty state (§10)
Before you ship a list/table/feed, build its empty state.

### Step 6 — Verify progressive disclosure
Can a user who knows nothing about Tradeverse understand this message? If no, rewrite.

### Step 7 — Test the failure paths
Manually trigger each error in §5 that applies. Screenshot each. Attach to your PR.

### Hard gates — a PR is rejected if:

- Any disabled button has no explanation (no tooltip, no inline text, no badge)
- Any error message dumps a raw exception or stack trace at the user
- Any error message shows a `trace_id` to the user when the category is not `SYSTEM_ERROR`
- Any long-running operation (> 2s) has no visible progress indicator
- Any list/table has no empty state
- Any money-moving action uses optimistic UI
- Any new error is introduced without adding it to §5 catalog
- Any new user-facing string lacks the Layer 1 + Layer 2 structure

---

## 15. Coding Patterns

### Frontend — React error-boundary pattern

```tsx
// components/ErrorFallback.tsx
export function ErrorFallback({ error }: { error: ApiError }) {
  const pattern = matchBehaviorPattern(error.code);  // reads this file's catalog
  switch (pattern.channel) {
    case "inline":  return <InlineError error={error} />;
    case "modal":   return <ErrorModal error={error} />;
    case "toast":   toast.error(formatError(error)); return null;
    case "banner":  return <BannerError error={error} />;
  }
}
```

### Backend — FastAPI error response helper

```python
# lib/errors.py
class TradeverseError(Exception):
    code: str
    category: Literal["USER_INPUT", "USER_STATE", "BUSINESS_RULE", "SYSTEM_ERROR"]
    severity: Literal["info", "warning", "blocker", "critical"]
    title: str
    message: str
    details: dict | None = None
    remediation: dict | None = None
    docs_url: str | None = None

    def to_response(self, trace_id: str | None = None) -> dict:
        return {
            "error": {
                "code": self.code,
                "category": self.category,
                "severity": self.severity,
                "title": self.title,
                "message": self.message,
                "details": self.details,
                "remediation": self.remediation,
                "trace_id": trace_id if self.category == "SYSTEM_ERROR" else None,
                "docs_url": self.docs_url,
            }
        }

# Example usage — raising a catalog error:
raise TradeverseError(
    code="U_RISK_CAPITAL_BELOW_MIN",
    category="USER_INPUT",
    severity="blocker",
    title="Below minimum investment",
    message=f"This strategy requires at least ${strategy.min_risk_capital:,}.",
    details={"entered": amount, "required": strategy.min_risk_capital, "currency": "USDT"},
    remediation={"action": "increase_amount", "cta_label": "Add funds", "cta_url": "/wallet/deposit"},
    docs_url="/help/minimum-investment",
)
```

### Frontend — Affordance state hook

```tsx
// Never hardcode button disabled states. Use a capability query.
const subscribe = useCapability("subscribe_to_strategy", { strategyId, amount });

<Button
  disabled={!subscribe.allowed}
  tooltip={subscribe.allowed ? null : subscribe.reason}
>
  Subscribe
</Button>
{!subscribe.allowed && subscribe.remediation && (
  <InlineHint
    text={subscribe.reason}
    cta={subscribe.remediation.cta_label}
    href={subscribe.remediation.cta_url}
  />
)}
```

The `/api/capabilities/:action` endpoint is the single place the backend computes gating. Frontend never duplicates the logic.

---

## 16. Accessibility

- Every toast/modal has an ARIA live region (`role="status"` for info, `role="alert"` for errors)
- Keyboard: modals trap focus, `Escape` dismisses non-destructive modals
- Color-blind safe: never rely on color alone for state; always pair with icon or label
- Screen reader: tooltips on disabled buttons are announced via `aria-describedby`
- Minimum contrast: WCAG AA (4.5:1 for text, 3:1 for UI elements)

---

## 17. Copy Voice & Tone

- **Clear, not clever.** "You need $2,000 to subscribe" beats "Just a tiny bit more to unlock the fun!"
- **Respectful, never condescending.** "Your withdrawal requires KYC verification" not "Oops! You forgot to verify!"
- **Action-oriented, not passive.** "Verify your identity to continue" not "Identity verification is required."
- **Specific, not vague.** "Daily limit: $50,000 (you've used $42,000)" not "Daily limit reached."
- **Financial tone = neutral and precise.** No exclamation marks in money contexts. No emojis in errors.
- **Sparse emoji.** One per message max, and only for status (🛡 protector, ⚠ warning, ✓ success, 🔧 maintenance). Never decorative.

### Forbidden phrases

| Don't say | Say instead |
|---|---|
| "Oops!" | (nothing — just describe the issue) |
| "Something went wrong" | Describe what went wrong, specifically |
| "Try again later" (alone) | "Try again in 5 minutes" or offer a retry button |
| "Invalid input" | Describe what's invalid and what format is expected |
| "Error 500" | "We couldn't process your request. Support: trace_id=XYZ" |
| "Please" | (not forbidden but often weak — drop when giving instructions) |

---

## 18. When You Don't Know the Pattern

If you're building something and the right pattern isn't in this file:

1. **Don't invent one.** Stop and check with Thuan.
2. Propose the new pattern as a PR to BEHAVIOR.md with 3 concrete examples.
3. Once approved, implement it and update this file.

This file is the source of truth. If reality diverges from it, update the file, not reality.

---

## 19. Quick Reference Card for Agents

Print this and keep it next to your work:

```
Before writing any user-facing code:
  ☐ What gating state exists?   → §3 + §5
  ☐ What errors can occur?       → §1 + §2 + §5
  ☐ What channel to use?         → §4
  ☐ 3-layer message written?     → §6
  ☐ Loading/pending state?       → §7
  ☐ Empty state designed?        → §10
  ☐ System events narrated?      → §8
  ☐ Confirmation modal needed?   → §9
  ☐ Copy follows voice rules?    → §17
  ☐ Accessible?                  → §16
  ☐ Tests cover failure paths?   → §14 step 7

Before writing any business logic or code touching money:
  ☐ No hardcoded numeric literals in business logic?    → §20.1
  ☐ Each value classified as snapshot or always-current? → §20.2
  ☐ Snapshot values stored on the entity row?           → §20.4
  ☐ Settlement reads snapshots, never current config?   → §20.12
  ☐ New keys added to CONFIG_CATALOG.md?                → §20.7
  ☐ Key names follow naming convention?                 → §20.6
  ☐ Tests verify snapshot immutability?                 → §20.13
```

---

**End of BEHAVIOR.md v1.1**
*This document is authoritative. Update it with every new pattern. Every agent should read this before building any user-facing feature or any feature touching money. Configurability is a non-negotiable architectural principle — see §20.*

## 20. Configurability Rule — Never Hardcode Financial Values

**This is non-negotiable.** Every numeric threshold, ratio, fee, limit, duration, or policy knob used in code must be a named configurable with a default value. Admins must be able to change these later without a code deploy. Agents that hardcode financial values will have their PRs rejected.

### 20.1 The core rule

```
Every numeric or policy value used in code is a named configurable
with a default. Values consumed by running entities (strategies,
challenges, subscriptions, settlements) are snapshotted at creation
time. New entities always use the current value.
```

### 20.2 Snapshot vs. always-current — the decision table

When an agent introduces a new configurable, it must be classified as one of two types. **Classify wrong and you create the most destructive bug class in finance: retroactive rule changes.**

| Config type | Snapshot at entity creation | Always read current |
|---|---|---|
| Profit splits (follower/trader/investor/platform %) | ✅ Snapshot on `CopyRelation` creation | |
| Trail Mode rules (required trades, win rate, drawdown cap, countdown) | ✅ Snapshot on `TrailChallenge` creation | |
| Trail Mode subscription price | ✅ Snapshot on `TrailChallenge` creation | |
| Prop Firm splits (trader %, platform %) | ✅ Snapshot on `PropFirmAccount` creation | |
| Prop Firm tier parameters (funded balance, drawdown cap) | ✅ Snapshot on `PropFirmAccount` creation | |
| Referral commission rates (L1/L2/L3 %) | ✅ Snapshot on each `Referral` row at event time | |
| Platform trading fee (maker/taker) | ✅ Snapshot on `Trade` creation | |
| Insurance coverage ratio per strategy | ✅ Snapshot on `CopyRelation` creation | |
| SettlementRule for a trade | ✅ Snapshot on trade open (rule ID stored on `Trade`) | |
| Min/max risk capital for subscription | | ✅ Validated at subscribe time; never snapshotted |
| Withdrawal fees (ERC20/TRC20/BEP20) | | ✅ Applied at withdrawal time from current value |
| Daily withdrawal limits | | ✅ Always current |
| Dual-approval threshold | | ✅ Always current |
| Chat rate limits | | ✅ Always current |
| Notification digest interval | | ✅ Always current |
| Poll intervals, circuit breaker thresholds | | ✅ Always current |
| KYC verification thresholds | | ✅ Always current |

### 20.3 The rule of thumb

- **Did the user commit to a value when they took an action?** → snapshot it on the entity.
- **Does the value only apply at the moment of an action?** → always current.

Examples:
- A follower subscribes to an Atlas Gold strategy expecting a 60/15/20/5 split. Snapshot. Admin changing splits tomorrow cannot silently change their deal.
- A user withdraws today. The withdrawal fee applies at withdrawal time. Always current. Admin raising the fee yesterday or lowering it tomorrow affects no one in-flight.
- A trader passes Trail Mode under current rules (10 trades, 60% win rate). Snapshot. If admin tightens Level 1 to 15 trades tomorrow, existing challenges keep their original bar.

### 20.4 Implementation contract for agents

**When building any entity that holds state over time:**

1. Identify every config value the entity's rules depend on.
2. Classify each as snapshot or always-current (§20.2).
3. For snapshot values: add columns to the entity table (`_snapshot` suffix) and populate at creation.
4. For always-current values: read from the config store at use time. Never cache inside the entity.
5. Name the config key with the namespaced pattern (§20.6).
6. Add the key + default value + classification to the `CONFIG_CATALOG.md` file (see §20.7).

**Rejection criteria — PR is blocked if:**

- Any decimal literal > 0 appears in business logic that isn't a config read (e.g., `if amount < 100:` → must be `if amount < config.get("wallet.min_withdrawal"):`)
- Any profit-split calculation reads the current config instead of a snapshot on the entity
- Any new configurable is introduced without being added to `CONFIG_CATALOG.md`
- Any snapshot column is named without the `_snapshot` suffix
- Any entity holding snapshots can be modified post-creation to a different snapshot value (snapshots are immutable)

### 20.5 Minimum implementation (day-1 scope)

We are **not** building a runtime admin config panel now. We are establishing the architecture so we can add one later without refactoring. For v2:

- **Storage:** a single `platform_config` table in Postgres with columns `(key, value_json, default_value_json, description, category, updated_by, updated_at)`.
- **Seeding:** a `seed_config.py` script populates defaults on first boot. Agents add new keys by appending to this script.
- **Reading:** a `config.get(key)` helper reads from Redis cache with 60s TTL, falls back to Postgres, falls back to seeded default. Never crashes on missing key (logs warning, returns default).
- **Writing:** a single `config.set(key, value, admin_id, reason)` helper that writes to Postgres, invalidates cache, and appends to `config_audit_log`. No UI; admins use a CLI command for now.
- **Audit log:** `config_audit_log` table stores `(timestamp, admin_id, key, old_value, new_value, reason)`. Immutable, append-only.
- **Snapshotting:** entity tables get snapshot columns (e.g., `CopyRelation.follower_pct_snapshot`). Agents populate these at creation from `config.get()`. Settlement code reads from the snapshot, never from `config.get()`.

That's the whole implementation. No version table, no approval workflow, no scoping. Those arrive when we build the admin UI — which the architecture already supports.

### 20.6 Config key naming convention

Flat, dot-separated, noun-first:

```
<domain>.<subcategory>.<specific>

Examples:
  strategy.split.default.follower_pct
  strategy.split.default.trader_pct
  strategy.split.default.insurance_investor_pct
  strategy.split.default.platform_pct
  strategy.limits.min_risk_capital
  strategy.limits.max_risk_capital
  strategy.limits.max_drawdown_cap_pct

  trail_mode.price_usdt
  trail_mode.initial_balance
  trail_mode.level_1.required_trades
  trail_mode.level_1.required_win_rate
  trail_mode.level_2.required_trades
  trail_mode.level_2.required_win_rate
  trail_mode.max_drawdown_pct
  trail_mode.countdown_days
  trail_mode.cooldown_days

  prop_firm.tier_1.funded_balance
  prop_firm.tier_1.trader_split_pct
  prop_firm.tier_1.max_drawdown_pct
  prop_firm.tier_1.daily_loss_limit_pct
  prop_firm.payout.min_amount
  prop_firm.payout.cycle_days
  prop_firm.payout.first_payout_age_days

  referral.rate.level_1
  referral.rate.level_2
  referral.rate.level_3
  referral.dispute_window_days
  referral.code_regen_cooldown_days

  wallet.fee.withdrawal.erc20
  wallet.fee.withdrawal.trc20
  wallet.fee.withdrawal.bep20
  wallet.limit.daily_withdrawal
  wallet.limit.min_withdrawal
  wallet.limit.dual_approval_threshold

  trading.fee.maker
  trading.fee.taker

  ops.balance_poller.interval_minutes
  ops.equity_protector.margin_warning_threshold
  ops.equity_protector.margin_emergency_threshold
  ops.copypro.circuit_breaker.fail_threshold
  ops.chat.rate_limit.per_min
  ops.notification.digest_interval_minutes
```

### 20.7 CONFIG_CATALOG.md — the running catalog

A sibling file `CONFIG_CATALOG.md` in the repo root lists every config key ever introduced. Structure:

```
| Key | Type | Default | Classification | Description | Added in PR |
|---|---|---|---|---|---|
| strategy.split.default.follower_pct | decimal | 0.60 | snapshot | Follower's share of Atlas Gold profit | #12 |
| strategy.split.default.trader_pct | decimal | 0.20 | snapshot | Trader's share of Atlas Gold profit | #12 |
| wallet.fee.withdrawal.erc20 | decimal | 5.00 | always-current | ERC20 withdrawal network fee in USD | #15 |
```

Every PR that introduces a new config adds its row to this table. Every PR that removes a config marks the row as `[DEPRECATED in PR #X]`. This file is an auditable history of every knob in the system.

### 20.8 Validation at config-write time

When admin changes a value via `config.set()`:

- **Type check:** value must match the declared type (decimal / int / bool / enum).
- **Bounds check:** if a min/max is declared in the seed, enforce it. Reject with `BEHAVIOR § ERR` codes.
- **Sum-group check:** all keys sharing a `sum_group` must total to 1.00 exactly. E.g., setting `follower_pct = 0.70` when `trader_pct = 0.20` and `insurance_pct = 0.15` and `platform_pct = 0.05` rejects (sum would be 1.10).
- **Sanity delta:** changes > ±50% of current value trigger an extra confirmation in the CLI: "You're changing X from 100 to 5000 (50× increase). Confirm? [y/N]"
- **Required reason:** `config.set()` fails if `reason` is empty or < 10 chars.

### 20.9 When a config change happens — agent handling

- **In-flight entities (CopyRelations, TrailChallenges, PropFirmAccounts, open Trades) are unaffected.** They carry their own snapshot values. This is the whole point of §20.2.
- **New entities created after the change pick up the new value automatically** via `config.get()`.
- **User-facing impact:** if the change affects what a user would see (e.g., raising min_risk_capital from $100 to $500), the frontend capability endpoint (§15) returns the new value on next request. Users with existing subscriptions are unaffected; users trying to subscribe see the new minimum.
- **No user notification required for global config changes** unless the change creates a new gating condition for existing users (rare). If it does, surface via banner per §4.

### 20.10 Worked example — Atlas Gold split change

**Scenario:** Admin changes `strategy.split.atlas_gold_momentum.follower_pct` from 0.60 to 0.55, `platform_pct` from 0.05 to 0.10 (platform taking more, followers getting less).

**What happens:**
- `config.set()` validates sum_group still totals 1.00 ✓
- Redis cache for both keys invalidated
- Audit log row appended
- **Existing CopyRelations** still have `follower_pct_snapshot = 0.60`, `platform_pct_snapshot = 0.05`. Their settlements continue at 60/15/20/5.
- **New CopyRelations** created from this moment forward snapshot at 0.55 / 0.15 / 0.20 / 0.10. Their settlements use the new split.
- Users already subscribed see no change. Users subscribing to Atlas Gold Momentum from now on see the new disclosed split.

**This is correct behavior.** Admin changes are forward-only. No one's deal changes retroactively. No notification needed — existing users' economics are preserved.

### 20.11 Worked example — Withdrawal fee change

**Scenario:** Admin raises `wallet.fee.withdrawal.erc20` from $5 to $8.

**What happens:**
- No snapshot involved (always-current value).
- Next withdrawal attempted with ERC20 network sees the $8 fee.
- No in-flight entity affected (withdrawals are point-in-time events; no pending withdrawal has a snapshotted fee).
- Frontend capability endpoint returns the new fee on next query, user sees $8 in the withdrawal form.

**No retroactive effect** because withdrawals don't have a "commitment period" — the fee applies at the moment of withdrawal, period.

### 20.12 Anti-patterns to reject

```python
# ❌ Hardcoded literal in business logic
if amount < 100:
    raise TradeverseError("below_min")

# ❌ Reading config at settlement time (breaks when admin changes split)
def settle(trade):
    split = config.get("strategy.split.default.follower_pct")
    follower_share = trade.pnl * split

# ❌ Snapshotting as a mutable reference (changing by reference later)
copy_relation.splits = config.get_all("strategy.split.default.*")  # live reference, BAD

# ❌ Treating operational configs as snapshots (unnecessary storage, stale values)
class BalancePoller:
    def __init__(self):
        self.interval = config.get("ops.balance_poller.interval_minutes")  # cached forever, BAD
```

```python
# ✅ Config-driven check at action time
if amount < config.get("strategy.limits.min_risk_capital"):
    raise TradeverseError("U_RISK_CAPITAL_BELOW_MIN", details={...})

# ✅ Snapshot at entity creation
def create_copy_relation(follower, strategy, risk_capital):
    return CopyRelation(
        ...,
        follower_pct_snapshot=config.get(f"strategy.split.{strategy.key}.follower_pct"),
        trader_pct_snapshot=config.get(f"strategy.split.{strategy.key}.trader_pct"),
        insurance_pct_snapshot=config.get(f"strategy.split.{strategy.key}.insurance_investor_pct"),
        platform_pct_snapshot=config.get(f"strategy.split.{strategy.key}.platform_pct"),
    )

# ✅ Settlement reads from snapshot, never from current config
def settle(trade, copy_relation):
    follower_share = trade.pnl * copy_relation.follower_pct_snapshot

# ✅ Always-current reads fresh every time
class BalancePoller:
    @property
    def interval_minutes(self):
        return config.get("ops.balance_poller.interval_minutes")
```

### 20.13 Agent checklist for any new feature touching money

```
☐ Identified every numeric literal — none remain in business logic
☐ Each configurable classified as snapshot or always-current (§20.2)
☐ Snapshot configs stored on the entity with `_snapshot` suffix
☐ Always-current configs read via config.get() at use time
☐ All new keys follow naming convention (§20.6)
☐ All new keys added to CONFIG_CATALOG.md with default + classification
☐ Default values match current hardcoded behavior (no silent behavior change)
☐ Settlement/calculation code reads from snapshot, never current config
☐ User-facing impact documented (does this change a gating condition?)
☐ Tests verify snapshot immutability (changing config does NOT affect old entities in test)
```

---


