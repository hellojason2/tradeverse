# Tradeverse 2.0 — Product Requirements Document (PRD)

## Overview

This document outlines the complete functional specification for Tradeverse 2.0, a web-based trading and copy-trading platform. It covers all user-facing modules, their components, and the detailed interactions for each feature.

---

## MODULE 1: Authentication & Onboarding

### 1.1 Login/Register Page

#### Components

- Logo/Brand area
- Email/Phone input field
- Password input field
- **"Login"** button (primary CTA — green)
- **"Not a user yet? Sign up now!"** link
- Divider with **"or"** text
- Third-party login buttons:
  - **"Continue with Google"**
  - **"Continue with Apple"**
  - **"Continue with Telegram"**

#### Interactions

##### On Page Load

- Clean white card centered on screen.
- All input fields empty with placeholder text.
- Buttons in default state.

##### When User Clicks Email/Phone Field

- Field gains focus border (blue/green highlight).
- Placeholder text disappears.
- Keyboard appears (mobile).

##### When User Clicks Password Field

- Field gains focus border.
- Text masked with dots/asterisks.
- **"Show password"** eye icon appears (optional).

##### When User Clicks "Login" Button

**Validation Sequence:**

1. Check if email/phone field is empty → If yes: Red border + shake animation + tooltip **"Please enter email/phone"**.
2. Check if password field is empty → If yes: Red border + shake animation + tooltip **"Please enter password"**.
3. Show loading spinner on button (disable button).
4. API call to backend.

**On Success:**

- Green checkmark animation.
- Redirect to Overview page.
- Store JWT token in `localStorage`.

**On Failure:**

- Red error message below button: **"Invalid credentials"** or **"Account not found"**.
- Button returns to default state.
- Input fields clear password field only.

##### When User Clicks "Sign up now!" Link

- Modal/Popup appears with registration form.
- Fields: Email, Password, Confirm Password, Terms checkbox.
- **"Create Account"** button.
- **"Already have account? Login"** link to close modal.

##### When User Clicks "Continue with Google"

- Google OAuth popup window opens (centered, 600x700px).
- Shows Google account selection.
- On selection: Loading state on main page.
- On success: Popup closes, redirect to Overview.
- On failure: Error toast **"Google login failed"**.

##### When User Clicks "Continue with Apple"

- Apple Sign-In native modal appears.
- Options: **"Share My Email"** or **"Hide My Email"**.
- Biometric auth (FaceID/TouchID) if enabled.
- On success: Redirect to Overview.
- On cancel: Modal closes, no action.

##### When User Clicks "Continue with Telegram"

- Telegram authorization popup appears.
- Shows: **"Connect Telegram"** header.
- Telegram logo (blue paper plane).
- Message: **"After clicking on the Connect button below, you will be redirected to the Telegram pages to complete authorization"**.
- Yellow **"Connect"** button.
- On click: Opens Telegram OAuth.
- Note shown: **"The telegram group may be our main communication community in the future"**.

---

## MODULE 2: Main Dashboard / Overview

### 2.1 Header Navigation Bar

#### Components

- Tradeverse logo (clickable → Home)
- Main navigation tabs:
  - **Overview** (active state)
  - **Strategies**
  - **Trail Mode**
  - **Referral**
  - **Events**
  - **What's New?**
- Right side:
  - Language selector dropdown
  - Settings icon
  - User avatar dropdown
  - Logout button (red)

#### Interactions

##### When User Clicks Navigation Tab

- Active tab changes (green underline/highlight).
- Page content updates without full reload (SPA).
- Loading skeleton appears during content fetch.
- URL updates (e.g., `/overview` → `/strategies`).

##### When User Clicks Language Selector

- Dropdown appears below icon.
- Options: English, 中文, Español, etc.
- On selection: Page reloads with new language.
- Selection saved to user preferences.

##### When User Clicks Settings Icon

- Dropdown menu appears:
  - Profile Settings
  - Security
  - Notifications
  - Theme (Dark/Light toggle)
- On item click: Navigate to respective page.

##### When User Clicks User Avatar

- Dropdown menu appears:
  - User name & email (non-clickable header)
  - **"My Profile"**
  - **"Wallet"**
  - **"My Signals"**
  - Divider
  - **"Logout"** (red text)
- Click outside closes dropdown.

##### When User Clicks Logout

- Confirmation modal appears:
  - Title: **"Confirm Logout"**
  - Message: **"Are you sure you want to logout?"**
  - Buttons: **"Cancel"** (gray), **"Logout"** (red)
- On confirm: Clear tokens, redirect to login page.
- On cancel: Modal closes.

---

### 2.2 Asset Overview Section

#### Components

- Total Balance display (large font)
- **"Hide Balance"** eye icon toggle
- Asset cards:
  - Broker Account(s) — up to 5
  - Wallet (USDT balance)
  - Trial Mode (if active)
- Quick action buttons: **Deposit**, **Withdraw**

#### Interactions

##### When Page Loads

- Fetch all asset data from API.
- Display loading skeletons for 3 cards.
- Animate numbers counting up (optional).

##### When User Clicks "Hide Balance" Eye Icon

- All monetary values replace with **"****"** or **"•••••"**.
- Icon changes from open eye to crossed eye.
- State saved to `localStorage`.
- Persists across pages.

##### When User Clicks Broker Account Card

- Expand/collapse animation.
- Shows detailed breakdown:
  - Total invested
  - Total profit/loss
  - Active positions count
  - Copy trading vs Insurance split
- Card border highlights (green if profit, red if loss).

##### When User Clicks Wallet Card

- Modal appears: **"Wallet Details"**
- Shows:
  - Available balance
  - Locked balance (in trades)
  - Total balance
  - Quick actions: Deposit, Withdraw, Transfer
  - Transaction history mini-list (last 5)
  - **"View All Transactions"** link

##### When User Clicks "Deposit" Button

- Modal appears: **"Deposit USDT"**
- Tabs: **ERC20 | TRC20 | BEP20**
- Shows:
  - Deposit address (QR code + text)
  - Warning: **"Only send USDT to this address"**
  - Network selection
  - Minimum deposit amount
  - Confirmations required
- **"Copy Address"** button → Toast: **"Address copied!"**
- **"I've sent funds"** button → Opens form to submit TX hash.

##### When User Clicks "Withdraw" Button

- Modal appears: **"Withdraw USDT"**
- Form fields:
  - Withdrawal address (input)
  - Address book dropdown (saved addresses)
  - Network selection (ERC20/TRC20/BEP20)
  - Amount input + **"Max"** button
  - Available balance display
  - Fee calculation (auto)
  - Receivable amount (auto-calculate)
  - 2FA input field (Google Authenticator)
  - **"Submit"** button (green)

**Validation:**

- Insufficient balance → Error message.
- Invalid address → Red border + error.
- Below minimum → Error message.

**On submit:** Confirmation modal.

- Shows all details.
- **"Confirm Withdrawal"** button.
- Processing state → Success message.

##### When User Clicks Trial Mode Card

- Navigate to Trail Mode page.
- Or quick preview modal:
  - Current balance
  - P/L percentage
  - Days remaining
  - **"Continue Challenge"** button.

---

### 2.3 Active Positions List

#### Components

- Filter tabs: **All | Copy Trading | Insurance**
- Sort dropdown: **Newest | Oldest | Highest P/L**
- Position cards (multiple)

**Position Card — Copy Trading:**

- Signal provider avatar + name
- Strategy name/tags
- Investment amount
- Current P/L (absolute + percentage)
- Profit share percentage
- Total AUM (assets under management)
- Number of followers
- Drawdown progress bar
- Status badge (Fundraising/Active/Completed)
- Win rate percentage
- Lock icon (if funds locked)

**Position Card — Insurance:**

- Similar layout
- Insurance amount
- P/L (absolute + percentage)
- Coverage details
- Claim status (if applicable)

#### Interactions

##### When User Clicks Filter Tab

- List filters in real-time.
- Smooth fade animation for filtered items.
- Count badge updates.

##### When User Clicks Sort Dropdown

- Options appear:
  - Newest First
  - Oldest First
  - Highest Profit
  - Lowest Profit
  - Highest Investment
- On selection: List reorders instantly.

##### When User Clicks Position Card

- Navigate to Position Detail Page.
- Or expand inline showing:
  - Entry date/time
  - Current trades list
  - Performance chart (mini)
  - **"Close Position"** button (if allowed)
  - **"Add Funds"** button (if allowed)

##### When User Hovers Over Lock Icon

- Tooltip appears:
  - **"Locked funds can only be deposited/withdrawn"**
  - **"Cannot participate in insurance"**
  - Unlock date (if applicable)

##### When User Clicks Signal Provider Name/Avatar

- Navigate to Provider Profile Page.
- Shows their full stats, history, other signals.

##### When Position Status is "Fundraising"

- Countdown timer displayed.
- Progress bar: Raised/Target amount.
- **"Add More Funds"** button enabled.
- **"Withdraw"** button disabled with tooltip.

##### When Position Status is "Active"

- Real-time P/L updates (WebSocket).
- Green/red pulse animation on P/L change.
- **"Close Position"** button enabled.
- Warning modal on close: **"Confirm closing position?"**

##### When User Clicks "Close Position"

- Confirmation modal:
  - Position details
  - Current P/L
  - Warning: **"This action cannot be undone"**
  - **"Confirm Close"** button (red)
- On confirm: API call → Loading → Success.
- Position moves to **"History"** tab.
- Toast notification: **"Position closed successfully"**.

---

## MODULE 3: Signal Plaza (Strategies Page)

### 3.1 Signal Provider Grid

#### Components

- Search bar
- Filter sidebar/dropdown:
  - Status: **All | Fundraising | Active**
  - Type: **Copy Trading | Insurance**
  - Sort: **Performance | AUM | Newest**
- Grid of signal cards (9–18 providers)

**Signal Card Components:**

- Provider avatar (circular)
- Provider name
- Strategy tags (chips)
- Win rate badge
- Max drawdown indicator
- Trade count
- Fundraising progress bar
- Profit share percentage
- Countdown timer (if fundraising)
- Status badge with colored dot
- Action button

#### Interactions

##### When User Clicks Search Bar

- Input field expands.
- Real-time search as user types.
- Suggestions dropdown (optional).
- Filter cards instantly.

##### When User Clicks Filter Button

- Filter panel slides in from right (mobile).
- Or dropdown appears (desktop).
- Options with checkboxes.
- **"Apply Filters"** button.
- **"Reset"** button.
- Active filters shown as tags.

##### When User Clicks Signal Card (not button)

- Navigate to Signal Detail Page.
- Shows:
  - Full provider profile
  - Performance chart (30d, 90d, 1y, All)
  - Trading history table
  - Risk metrics
  - User reviews (if any)
  - **"Subscribe"** CTA

##### When User Clicks "Subscribe" Button (Fundraising)

- Modal: **"Subscribe to [Strategy Name]"**
- Options:
  - Copy Trading tab | Insurance tab
  - Investment amount input
  - Broker account selector (if multiple)
  - Profit share display
  - Risk disclaimer checkbox
  - **"Confirm Subscription"** button

**On confirm:**

- Loading state.
- Success animation.
- Redirect to Overview.
- Toast: **"Subscription successful!"**

##### When User Clicks "History" Button (Active/Completed)

- Modal: **"Trading History"**
- Table with columns:
  - Date/Time
  - Pair
  - Type (Buy/Sell)
  - Entry Price
  - Exit Price
  - P/L
  - Status
- Pagination.
- Export button (CSV).

##### When User Hovers Over Win Rate

- Tooltip: **"Win rate calculated from last 100 trades"**
- Detailed breakdown.

##### When User Hovers Over Drawdown

- Tooltip: **"Maximum peak-to-trough decline"**
- Visual chart showing drawdown periods.

##### When Countdown Timer Reaches Zero

- Card updates automatically.
- Status changes to **"Active"** or **"Closed"**.
- Button changes from **"Subscribe"** to **"History"**.
- Notification if user subscribed: **"Fundraising completed!"**

---

## MODULE 4: Trail Mode (Trial/Training)

### 4.1 Trail Mode Landing

#### Components

- Hero section with explanation
- Pricing card
- Requirements list
- **"Start Trial"** button
- FAQ accordion

#### Interactions

##### When User Clicks "Start Trial"

- Check if broker account bound:
  - If **NO**: Modal **"Bind Broker First"**
    - Message: **"Please bind a broker account to start trial"**
    - **"Bind Now"** button → Navigate to Settings
    - **"Cancel"** button
  - If **YES**: Proceed to payment.

**Payment Modal:**

- Title: **"Start Trail Mode Challenge"**
- Price: **"$99.99 USDT"** (example)
- Payment method: Wallet balance
- Current balance display
- **"Confirm Payment"** button

**On confirm:**

- Deduct from wallet.
- Create sim account.
- Redirect to Trail Mode Dashboard.

---

### 4.2 Trail Mode Dashboard

#### Components

- Sim account info card:
  - Initial balance
  - Current balance
  - P/L (absolute + %)
- Progress section:
  - Level 1 indicator
  - Level 2 indicator
  - Visual progress line
- Rules panel:
  - Countdown timer (30 days)
  - Max drawdown: 15%
  - Current drawdown progress bar
  - Minimum trades requirement
- Trading interface (simulated)
- **"Refund Subscription"** button (if passed)

#### Interactions

##### When Page Loads

- Check trial status from API.
  - If not started: Show landing page.
  - If active: Show dashboard.
  - If completed: Show results.

##### Countdown Timer

- Displays: **"29d 14h 32m 15s"**
- Updates every second.
- Color changes:
  - **Green**: >7 days
  - **Yellow**: 3–7 days
  - **Red**: <3 days
- At zero: Auto-fail, show failure modal.

##### When User Makes a Trade

- Reset countdown timer to 30 days.
- Update sim balance.
- Recalculate P/L.
- Check drawdown rules.
- If drawdown > 15%:
  - Immediate failure.
  - Modal: **"Challenge Failed"**
  - Reason: **"Maximum drawdown exceeded"**
  - **"Try Again"** button (pay again).

##### Progress Indicators

- Level 1: **"Complete 10 trades with 60% win rate"**
- Level 2: **"Complete 20 trades with 65% win rate"**
- Visual checkmarks when completed.
- Click level badge → Detailed requirements modal.

##### When Both Levels Passed

- **"Refund Subscription"** button activates (green).
- Celebration animation (confetti).
- Badge: **"Qualified Signal Provider"**.
- Button click:
  - Confirmation modal.
  - **"Refund $99.99 to wallet?"**
  - On confirm: Process refund.
  - Success message.
  - Unlock provider dashboard access.

##### When User Clicks Trading Interface

- Simulated trading view.
- Same UI as real trading.
- **"Paper Trading"** watermark.
- Place trades without real money.
- Real-time market data (delayed).

##### Drawdown Progress Bar

- Visual: Current / 15%
- Color: Green (<10%), Yellow (10–13%), Red (>13%)
- Warning pulse when >12%.
- Tooltip: **"You are approaching the limit"**.

---

## MODULE 5: Wallet & Transactions

### 5.1 Wallet Overview

#### Components

- Total balance (large)
- Available / Locked split
- **Deposit** button (green)
- **Withdraw** button (outline)
- Transaction history table
- Filter: **All | Deposit | Withdraw | Transfer**

#### Interactions

##### When User Clicks Transaction Row

- Expand row or modal with details:
  - TX Hash (clickable → blockchain explorer)
  - Date/Time
  - Type
  - Amount
  - Fee
  - Status (Pending/Confirmed/Failed)
  - Confirmations count
  - From/To addresses

##### When Status is "Pending"

- Loading spinner.
- **"X of Y confirmations"**.
- Estimated time remaining.
- Cannot cancel (for deposits).
- Can cancel withdrawal (if not processed).

##### When User Clicks "Cancel" (Withdrawal)

- Confirmation modal.
- **"Cancel Withdrawal Request?"**
- On confirm: Status → **"Cancelled"**.
- Funds returned to balance.

---

### 5.2 Deposit Flow

#### Steps

1. **Network Selection:**
   - Cards: **ERC20 | TRC20 | BEP20**
   - Shows: Network fee, Confirmation time.
   - Recommended badge.
   - On click: Show address.

2. **Address Display:**
   - QR code (scannable)
   - Address text (copyable)
   - **"Copy"** button → Toast
   - Warning banner: **"Only send USDT"**
   - Minimum deposit notice.

3. **TX Hash Submission:**
   - Input field: **"Paste transaction hash"**
   - **"I've sent funds"** button
   - On submit:
     - Validate hash format.
     - API call to verify.
     - Success: **"Deposit detected, waiting confirmations"**
     - Error: **"TX hash not found or invalid"**

4. **Confirmation Tracking:**
   - Progress bar: 0/12 confirmations.
   - Real-time updates via WebSocket.
   - At completion:
     - Notification: **"Deposit confirmed!"**
     - Balance updates.
     - TX moves to **"Completed"**.

---

### 5.3 Withdraw Flow

#### Steps

1. **Address Input:**
   - Field: **"Withdrawal address"**
   - Address book dropdown.
   - **"Add New Address"** button.
   - QR scanner (mobile).
   - Validation: Checksum, format.

2. **Address Book Modal:**
   - List of saved addresses.
   - Nickname + truncated address.
   - **"Select"** button.
   - **"Delete"** button (with confirm).
   - **"Add New"** form:
     - Nickname
     - Address
     - Network
     - Save button.

3. **Amount Input:**
   - Field with **"Max"** button.
   - Balance display.
   - Fee calculator (auto).
   - Receivable amount (auto).
   - Minimum withdrawal notice.

**Validation:**

- Insufficient funds → Error.
- Below minimum → Error.
- Above daily limit → Error.

4. **2FA Verification:**
   - Google Authenticator code input.
   - 6-digit field.
   - **"Resend code"** (if email).
   - Timer: 30s countdown.
   - Validation: Correct/Incorrect.

5. **Confirmation Modal:**
   - Summary card:
     - To address (truncated)
     - Amount
     - Fee
     - Net amount
     - Network
   - Warning: **"Cannot be undone"**
   - **"Confirm Withdrawal"** button (red).

6. **Processing state:**
   - Spinner.
   - **"Processing..."** text.
   - Estimated time.

7. **Success:**
   - Checkmark animation.
   - TX hash display.
   - **"View on Explorer"** link.
   - Close button.

---

## MODULE 6: Referral System

### 6.1 Referral Dashboard

#### Components

- Referral code display (copyable)
- QR code for sharing
- Stats cards:
  - Total referrals
  - Active referrals
  - Total earnings
  - Pending earnings
- Referral tree visualization
- Leaderboard
- Earnings history table

#### Interactions

##### When User Clicks "Copy Code"

- Code copied to clipboard.
- Toast: **"Referral code copied!"**
- Button shows checkmark briefly.

##### When User Clicks "Share" Button

- Share modal appears:
  - Social media buttons:
    - Twitter
    - Telegram
    - WhatsApp
    - Email
  - Copy link button.
  - QR code download.

##### When User Clicks Referral Tree Node

- Expand/collapse children.
- Show user details on hover:
  - Username
  - Join date
  - Total trades
  - Your earnings from them.
- Click user → Profile page.

##### Leaderboard

- Top 10 referrers.
- Rank, username, referrals, earnings.
- Current user highlighted.
- Refresh button.
- Time period filter: **Weekly | Monthly | All-time**.

##### Earnings Table

- Columns:
  - Date
  - Referred user
  - Activity type
  - Commission %
  - Amount
  - Status (Pending/Paid)
- Filter by status.
- Export button.

---

## MODULE 7: Activities & Rewards

### 7.1 Activities Page

#### Components

- Calendar view (login streak)
- Task list:
  - Daily login
  - Daily trade
  - Referral registration
  - Referral deposit
  - Referral trade
- Progress indicators
- Reward claims
- History

#### Interactions

##### Daily Login

- Calendar shows checkmarks for logged-in days.
- Streak counter: **"7 day streak!"**
- Milestone badges (7, 14, 30 days).
- Click day → Reward details.

##### When User Completes Task

- Task card animates (bounce).
- Checkmark appears.
- **"Claim Reward"** button activates.
- Click button:
  - Modal: **"Reward Claimed!"**
  - Amount/type display.
  - **"Add to Wallet"** button.
  - Success: Balance updates.

##### Task Types

**Daily Login:**

- Auto-detected.
- Reward: Small insurance bonus.
- Claim button appears next day.

**Daily Trade:**

- Track first trade of day.
- Reward: Fee discount or bonus.
- Requires manual claim.

**Referral Tasks:**

- Triggered when referral acts.
- Notification badge.
- Higher rewards.

##### Progress Bars

- Visual: 3/5 tasks completed.
- Color fill animation.
- Tooltip: Complete all for bonus.

---

## MODULE 8: Community & News

### 8.1 News Feed (70% width)

#### Components

- News articles list
- Source badges (CryptoPanic API)
- Timestamp
- Category tags
- Read/unread indicator
- Load more button

#### Interactions

##### When User Clicks Article

- Expand inline or modal.
- Full article content.
- Source link (external).
- Mark as read.
- Share buttons.
- Related articles.

##### Auto-refresh

- New articles appear with **"X new articles"** banner.
- Click banner to load.
- Soft refresh every 5 minutes.

##### Filter

- Categories: **All | Bitcoin | Altcoins | DeFi | Regulation**
- Click tag → Filter feed.
- Active tag highlighted.

---

### 8.2 Community Chat (30% width)

#### Components

- Chat header
- Message list
- Input field
- User list (online)
- TG group QR code

#### Interactions

##### When Page Loads

- Connect to WebSocket.
- Load last 50 messages.
- Auto-scroll to bottom.
- Show online users count.

##### When User Sends Message

- Type in input field.
- Click send or press Enter.
- Optimistic UI: Message appears immediately.
- Server confirms → Keep message.
- Server rejects → Show error, retry option.
- Real-time: Others see message instantly.

##### Message Features

- Username + timestamp
- Avatar
- Text content
- Emoji support
- @mentions (highlight)
- Links (auto-detect, preview)
- Edit/Delete (own messages, time limit)

##### When User Clicks TG QR Code

- Modal: **"Join Telegram Group"**
- QR code (scannable)
- Invite link (copyable)
- Benefits list
- Close button

##### Moderation

- Report button on messages.
- Block user option.
- Admin actions (if admin).

---

## MODULE 9: Settings & Profile

### 9.1 Profile Settings

#### Components

- Avatar upload
- Username edit
- Email display (verified badge)
- Phone number (optional)
- KYC status
- Registration date
- Save button

#### Interactions

##### When User Clicks Avatar

- Modal: **"Change Avatar"**
- Options:
  - Upload new (file picker)
  - Remove current
  - Choose from gallery
- Crop tool (if upload).
- Preview.
- Save button.

##### When User Edits Username

- Input field becomes editable.
- Character counter (max length).
- Availability check (debounced).
- **"Username taken"** error if exists.
- Save button activates on change.
- Click save:
  - API call.
  - Success: Toast + update header.
  - Error: Show reason.

##### KYC Section

- Status badge: **Not Started | Pending | Verified | Rejected**
- If **Not Started**: **"Start KYC"** button.
- If **Pending**: **"Under review"** message, estimated time.
- If **Verified**: Green checkmark, benefits list.
- If **Rejected**: Reason + **"Retry"** button.

---

### 9.2 Security Settings

#### Components

- Password change
- 2FA setup (Google Authenticator)
- Login history
- Active sessions
- API keys (if applicable)

#### Interactions

##### Change Password

**Form:**

- Current password
- New password
- Confirm new password
- Password strength indicator
- Requirements list (min length, special char, etc.)

**Validation:**

- Current password wrong → Error.
- New passwords don't match → Error.
- Weak password → Warning.

**On success:**

- **"Password changed successfully"**
- Force logout from other devices (optional).
- Email notification.

##### 2FA Setup

**If not enabled:**

- **"Enable 2FA"** button.
- Modal:
  - Step 1: Download Google Authenticator.
  - Step 2: Scan QR code.
  - Step 3: Enter 6-digit code.
  - Step 4: Save backup codes.
- On verify:
  - Success: 2FA enabled.
  - Badge appears.
  - Required for withdrawals.

**If enabled:**

- Show status.
- **"Disable 2FA"** button.
- Requires current 2FA code + password.
- Warning modal: **"Disabling reduces security"**.

##### Login History

- Table:
  - Date/Time
  - IP address
  - Location (country/city)
  - Device/Browser
  - Status (Success/Failed)
- **"This is you"** badge for current session.
- Suspicious login alert.

##### Active Sessions

- List of devices.
- Current device highlighted.
- **"Logout"** button for each.
- **"Logout All Other Devices"** button.
- Confirmation modal.

---

### 9.3 Preferences

#### Components

- Language selector
- Theme toggle (Dark/Light)
- Notifications settings
- Currency display preference
- Timezone

#### Interactions

##### Theme Toggle

- Switch: **Dark | Light | Auto** (system)
- Instant preview.
- Saves to `localStorage`.
- Respects system preference if Auto.

##### Notifications

- Toggle switches:
  - Email notifications
  - Push notifications
  - Trade alerts
  - Price alerts
  - Marketing emails
- Save button.
- Test notification button.

##### Currency Display

- Dropdown: **USD | EUR | GBP | CNY | etc.**
- Crypto: **BTC | ETH | USDT**
- Applies to all monetary values.
- Real-time conversion.

---

## MODULE 10: Trading Interface

### 10.1 Order Entry

#### Components

- Market/limit/stop tabs
- Buy/Sell toggle
- Price input
- Amount input
- Total calculation
- Leverage slider (if margin)
- Order book
- Recent trades
- Place order button

#### Interactions

##### When User Selects Order Type

- **Market**: Price field disabled, executes at market.
- **Limit**: Price field enabled, set desired price.
- **Stop**: Stop price + limit price fields.
- Form updates dynamically.

##### When User Enters Amount

- Auto-calculate total: Price × Amount.
- Show available balance.
- Warning if insufficient.
- **"Max"** button sets to available balance (minus fees).

##### When User Clicks "Buy" or "Sell"

- Button color: **Green (Buy) | Red (Sell)**
- Confirmation modal (optional, based on settings).
- On confirm:
  - Loading state.
  - Order submitted.
  - Success: Order appears in **"Open Orders"**.
  - Error: Show reason (insufficient margin, etc.).

##### Order Book

- Real-time updates.
- Bids (green) on left/bottom.
- Asks (red) on right/top.
- Click price → Fill price field.
- Depth visualization.
- Spread display.

##### Recent Trades

- Live feed of executed trades.
- Price, amount, time.
- Color: **Green (buy) | Red (sell)**
- Click to fill price.

---

### 10.2 Position Management

#### Components

- Open positions table
- Unrealized P/L
- Margin used
- Liquidation price
- Close button
- Add margin button

#### Interactions

##### Real-time Updates

- P/L updates every second.
- Color changes with profit/loss.
- Pulsing animation on change.
- Margin level warning.

##### When User Clicks "Close"

- Modal: **"Close Position"**
- Details:
  - Pair
  - Size
  - Entry price
  - Current price
  - Unrealized P/L
  - Fees
- **"Market Close"** button (immediate).
- **"Limit Close"** option (set price).
- On market close:
  - Confirmation.
  - Execute at market.
  - Position closed.
  - P/L realized.
  - Notification.

##### Stop Loss / Take Profit

- **"Add SL/TP"** button.
- Modal:
  - Stop Loss price input.
  - Take Profit price input.
  - Percentage options.
  - Save button.
- Visual lines on chart.
- Editable.

##### Liquidation Warning

- When margin level < 150%: Yellow warning.
- When < 110%: Red warning + countdown.
- Push notification.
- Email alert.
- **"Add Margin"** button prominent.

---

## MODULE 11: Notifications System

### 11.1 Notification Center

#### Components

- Bell icon in header (with badge)
- Dropdown list
- Mark all read
- Settings link

#### Notification Types

**Trade Executed:**

- Icon: Chart
- **"Your buy order for 0.5 BTC executed at $45,000"**
- Timestamp
- Click → Position details

**Order Filled:**

- Icon: Checkmark
- **"Limit order filled: 1 ETH @ $3,200"**
- Click → Order history

**Price Alert:**

- Icon: Bell
- **"BTC reached $50,000"**
- Click → Chart

**Deposit Confirmed:**

- Icon: Wallet
- **"Deposit of 100 USDT confirmed"**
- TX hash link

**Withdrawal Processed:**

- Icon: Send
- **"Withdrawal of 50 USDT sent"**
- TX hash link

**Referral Activity:**

- Icon: Users
- **"John Doe signed up via your referral"**
- Click → Referral dashboard

**System Announcement:**

- Icon: Megaphone
- **"Maintenance scheduled for..."**
- Important badge

**Trial Mode Alert:**

- Icon: Trophy
- **"3 days remaining in trial"**
- **"Drawdown warning: 12%/15%"**

#### Interactions

##### When Bell Icon Clicked

- Dropdown appears (300px wide).
- Header: **"Notifications"**
- Tabs: **All | Unread | Trade | System**
- List of notifications (last 20).
- **"Mark all as read"** button.
- **"View all"** link → Full page.
- Click notification:
  - Mark as read.
  - Navigate to relevant page.
  - Close dropdown.

##### Real-time

- WebSocket connection.
- New notification slides in from top.
- Badge count increments.
- Sound effect (optional, based on settings).
- Desktop push notification (if enabled).

##### When User Hovers Over Notification

- Delete icon appears.
- Click delete: Remove from list.
- Undo toast (5 seconds).

---

## MODULE 12: Error Handling & Alerts

### 12.1 Error Types & Handling

**Authentication Errors:**

- **"Session expired"** → Modal: **"Please login again"** → Redirect to login.
- **"Invalid credentials"** → Inline error below form.
- **"Account locked"** → Modal with support contact.

**Transaction Errors:**

- **"Insufficient balance"** → Red toast + link to deposit.
- **"Network error"** → Retry button + offline indicator.
- **"Transaction failed"** → Detailed error + TX hash.

**API Errors:**

- **404**: **"Resource not found"** → Back button.
- **500**: **"Server error"** → Retry + support link.
- **429**: **"Rate limit"** → Countdown timer.

**Validation Errors:**

- Inline field errors (red border + message).
- Form-level errors (banner at top).
- Real-time validation (on blur).

### 12.2 Alert Modals

**Confirmation Alerts:**

- Title: **"Are you sure?"**
- Message: Description of action.
- Buttons: **"Cancel"** (gray), **"Confirm"** (green/red).

**Warning Alerts:**

- Title: **"Warning"**
- Message: Potential risk or irreversible action.
- Buttons: **"Cancel"**, **"Proceed"** (red).

**Success Alerts:**

- Title: **"Success!"**
- Message: Action completed.
- Auto-close after 3 seconds.
- Checkmark animation.

**Error Alerts:**

- Title: **"Error"**
- Message: What went wrong.
- **"Retry"** button or **"Contact Support"** link.
- Red icon.

---

## MODULE 13: Loading States & Skeletons

### 13.1 Loading Indicators

**Page Load:**

- Full-screen overlay (optional).
- Spinner in center.
- Brand logo animation.
- Progress bar (if multi-step).

**Component Load:**

- Skeleton screens:
  - Gray shimmering boxes.
  - Match final layout.
  - Fade to content when loaded.
- Spinner for small components.
- Progress bar for file uploads.

**Button Loading:**

- Spinner replaces text/icon.
- Button disabled.
- Cursor: `not-allowed`.
- Example: **"Processing..."**

**Table Loading:**

- Skeleton rows (3–5).
- Match column widths.
- Animate shimmer.

**Card Loading:**

- Skeleton card shape.
- Image placeholder.
- Text lines placeholder.

---

## MODULE 14: Responsive Behavior

### 14.1 Breakpoints

**Desktop (>1024px):**

- Full sidebar navigation.
- Multi-column layouts.
- Hover effects enabled.
- Right-click menus.

**Tablet (768px – 1024px):**

- Collapsible sidebar.
- 2-column grids.
- Touch-friendly buttons.
- Swipe gestures.

**Mobile (<768px):**

- Bottom tab bar or hamburger menu.
- Single column.
- Full-screen modals.
- Simplified forms.
- Larger touch targets.

### 14.2 Mobile-Specific Interactions

**Navigation:**

- Bottom tab bar: **Home | Trade | Wallet | More**
- Swipe between tabs.
- Pull-to-refresh.

**Forms:**

- Native keyboard types (number, email).
- Autocomplete.
- Date pickers (native).
- File upload (camera/gallery).

**Modals:**

- Full-screen or bottom sheet.
- Swipe down to close.
- Back button handling.

**Charts:**

- Pinch to zoom.
- Pan to scroll.
- Tap for details.
- Simplified indicators.

---

## MODULE 15: Accessibility Features

### 15.1 Keyboard Navigation

- Tab order logical.
- Skip to content link.
- Focus indicators (visible outline).
- Escape key closes modals.
- Enter submits forms.
- Arrow keys for dropdowns.
- Space/Enter for buttons.

### 15.2 Screen Reader Support

- ARIA labels on all interactive elements.
- Live regions for dynamic content.
- Alt text for images.
- Form labels associated with inputs.
- Error announcements.
- Status updates.

### 15.3 Visual Accessibility

- High contrast mode option.
- Font size adjustment.
- Color-blind friendly palette.
- Focus visible on all elements.
- Reduced motion option.

---

## Complete Module Checklist

- [x] **Authentication**
  - [x] Login/Register
  - [x] Third-party OAuth
  - [x] Password recovery
  - [x] 2FA setup
- [x] **Dashboard**
  - [x] Asset overview
  - [x] Active positions
  - [x] Quick actions
  - [x] Performance summary
- [x] **Signal Plaza**
  - [x] Provider grid
  - [x] Filtering/sorting
  - [x] Subscription flow
  - [x] History view
- [x] **Trail Mode**
  - [x] Challenge entry
  - [x] Simulated trading
  - [x] Progress tracking
  - [x] Refund system
- [x] **Wallet**
  - [x] Deposit (multi-network)
  - [x] Withdraw (with 2FA)
  - [x] Transaction history
  - [x] Address management
- [x] **Trading**
  - [x] Order entry
  - [x] Position management
  - [x] Order book
  - [x] Chart integration
- [x] **Referral**
  - [x] Code generation
  - [x] Tree visualization
  - [x] Earnings tracking
  - [x] Leaderboard
- [x] **Activities**
  - [x] Daily tasks
  - [x] Reward claims
  - [x] Calendar view
  - [x] Progress tracking
- [x] **Community**
  - [x] News feed
  - [x] Chat system
  - [x] TG integration
  - [x] Moderation
- [x] **Settings**
  - [x] Profile management
  - [x] Security settings
  - [x] Preferences
  - [x] KYC flow
- [x] **Notifications**
  - [x] Real-time alerts
  - [x] Notification center
  - [x] Email/SMS
  - [x] Push notifications
- [x] **Error Handling**
  - [x] Validation
  - [x] Error messages
  - [x] Retry logic
  - [x] Support integration
- [x] **Loading States**
  - [x] Skeletons
  - [x] Spinners
  - [x] Progress bars
  - [x] Optimistic UI
- [x] **Responsive Design**
  - [x] Mobile adaptation
  - [x] Tablet layout
  - [x] Desktop optimization
  - [x] Touch interactions
- [x] **Accessibility**
  - [x] Keyboard nav
  - [x] Screen reader
  - [x] High contrast
  - [x] ARIA labels
