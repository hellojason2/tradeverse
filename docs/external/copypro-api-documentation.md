# CopyPro / TradeCopy System Documentation

> **Source:** https://copy3.mrpc.pro (frontend) + https://copyback3.mrpc.pro (backend)
> **API Base:** https://copyback3.mrpc.pro/ (configurable — see `docs/blueprint/CONFIG_CATALOG.md` under `copy_engine.base_url`)
> **Version:** v2026.04.16-08.27

---

## URL Change Notice

If the CopyPro backend URL changes in the future, update **only** these two places:

1. **`docs/blueprint/CONFIG_CATALOG.md`** — change `copy_engine.base_url` and `copy_engine.frontend_url`
2. **`api/.env.example` (and your live `.env`)** — change `COPYPRO_BASE_URL` and `COPYPRO_FRONTEND_URL`

**Do NOT** hardcode `copyback3.mrpc.pro` or `copy3.mrpc.pro` anywhere else in the codebase. The CopyPro HTTP client (unit D1) reads from environment/config only.

---

## Table of Contents
- [Overview](#overview)
- [Architecture & Deployment](#architecture--deployment)
- [Frontend UI Structure](#frontend-ui-structure)
- [Authentication](#authentication)
- [Accounts](#accounts)
- [Copiers / Copy Engine](#copiers--copy-engine)
- [Orders](#orders)
- [Trade Statistics & Reports](#trade-statistics--reports)
- [Logs](#logs)
- [Symbol Mapping](#symbol-mapping)
- [Equity Protector](#equity-protector)
- [Manager / Admin Endpoints](#manager--admin-endpoints)
- [Utilities](#utilities)
- [Data Models](#data-models)

---

## Overview

CopyPro (also referred to as TradeCopy) is a trade copier system for MetaTrader 4 and MetaTrader 5.
It provides a Blazor Server frontend dashboard and a RESTful backend API.

**Key capabilities:**
- Connect MT4/MT5 accounts (master and slave)
- Configure copiers with risk management (FixedLot, LotMultiplier, BalanceMultiplier, etc.)
- Copy trades in real-time with optional SL/TP copying, symbol mapping, and filtering
- Equity protector with callbacks
- Trade logging and statistics
- Manager/admin endpoints for multi-user oversight

---

## Architecture & Deployment

The system is designed to run as Docker containers:

### 1. MT4/MT5 REST APIs
```bash
docker login reg.mtapi.io:5050
docker run -d --restart always -p 5014:80 --name lid4 reg.mtapi.io:5050/root/loginid-mt4-bin
docker run -p 5004:80 --add-host=host.docker.internal:host-gateway \
    -e LoginIdUrl='http://host.docker.internal:5014' -d --restart always \
    --name mt4 reg.mtapi.io:5050/root/mt4rest-full/mt4rest
docker run -d --restart always -p 5015:80 --name lid5 reg.mtapi.io:5050/root/loginid-mt5-bin
docker run -p 5005:80 --add-host=host.docker.internal:host-gateway \
    -e LoginIdUrl='http://host.docker.internal:5015' -d --restart always \
    --name mt5 reg.mtapi.io:5050/root/mt5rest-full/mt5rest
```
After that MT4 API is available at port 5004, MT5 API at port 5005.

### 2. MongoDB
```bash
docker run --name=mongo \
    -e=MONGO_INITDB_ROOT_USERNAME=main_admin \
    -e=MONGO_INITDB_ROOT_PASSWORD=some_password \
    --volume=/root/MongoData:/data/db \
    -p 27017:27017 --restart=always --runtime=runc --detach=true mongo
```
MongoDB available at port 27017.

### 3. Copy Backend
```bash
docker run -d --restart always -p 5020:80 --add-host=host.docker.internal:host-gateway --name copyback \
    -e ApiMT4='http://host.docker.internal:5004' \
    -e ApiMT5='http://host.docker.internal:5005' \
    -e MongoDB='mongodb://main_admin:some_password@host.docker.internal:27017' \
    reg.mtapi.io:5050/root/tradecopy
```
Copier backend available at port 5020.

### 4. Copy Frontend
```bash
docker run -d --restart always -p 5030:8080 --add-host=host.docker.internal:host-gateway --name copyfront \
    -e CopyBackend='http://host.docker.internal:5020' \
    reg.mtapi.io:5050/root/copyfront
```
Copier frontend at port 5030.

### Building from Sources
```bash
git clone https://git.mtapi.io/root/tradecopy
cd tradecopy
docker build -t tradecopy ./tradecopy
docker run -d --restart always --name tc -p 5009:80 tradecopy
# Service available at port 5009
```

---

## Frontend UI Structure

The frontend (copy3.mrpc.pro) is a Blazor Server application called **CopyPro** with the following navigation structure:

| Route | Name | Description |
|-------|------|-------------|
| `/` | Home / Dashboard | Portfolio value, Open orders count, Accounts count, Copiers count. Tabs: Accounts / Open orders / Closed orders |
| `/Accounts` | Accounts | List of connected MT4/MT5 accounts with connection status. Add Account button |
| `/CopiersNew` | Copiers | Manage master/slave copier relationships |
| `/TradeLogsAll` | Logs | View trade logs across all copiers |
| `/Login` | Login | User authentication |

**UI Framework:**
- Blazor Server (ASP.NET Core)
- Tailwind CSS for styling (with dark mode support)
- Chart.js for charts
- Font Awesome + Bootstrap Icons

---

## Authentication

### GET /SignUp
**Summary:** Register a new user using email. Password hash not required.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | Yes | string | Manager key. One manager control several users. |
| email | query | Yes | string | Email address (must be unique) |
| passwordHash | query | No | string | Client-side sha256 hashed password. Not required. |

**Responses:**
- `200`: Returns the new user's userKey
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /SignUpNonHashed
**Summary:** Register a new user using email and password hash

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| email | query | Yes | string | Email address (must be unique) |
| password | query | Yes | string | Client-side password |
| managerKey | query | No | string | Manager key |

**Responses:**
- `200`: Returns the new user's userKey
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /SignIn
**Summary:** Authenticate user using email and hashed password

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| email | query | Yes | string | Registered email address |
| passwordHash | query | Yes | string | Client-side hashed password |

**Responses:**
- `200`: Returns the user's userKey
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /PasswordForgot
**Summary:** Request password reset link by email. Generates a unique reset key, stores it, and sends a reset link via email.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| email | query | Yes | string | Registered email address |
| frontEndResetUrl | query | Yes | string | Frontend URL to append resetKey to (e.g. https://yourapp.com/reset-password) |

**Responses:**
- `200`: OK
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /PasswordReset
**Summary:** Reset user password using reset key. Updates password hash and clears the reset key.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| resetKey | query | Yes | string | Reset key received by email |
| newPasswordHash | query | Yes | string | New password hash (client-side hashed) |

**Responses:**
- `200`: OK
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /GetUserByEmail
**Summary:** Get user by email and managerKey

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| email | query | Yes | string | User email |
| managerKey | query | Yes | string | Manager key assigned to user |

**Responses:**
- `200`: Returns the user object
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

## Accounts

### GET /AddAccount
**Summary:** Adds an MT trading account to the account list.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | Yes | string | Manager key |
| name | query | Yes | string | Display account name.  Example: "default" |
| userKey | query | Yes | string | UserKey from https://users.mtapi.io portal. Please register for free. |
| type | query | Yes | string `[MT5, MT4]` | Source account type.  Example: ApiType.MT4 |
| user | query | Yes | integer (int64) | Source account number.  Example: 1124193263 |
| password | query | Yes | string | Source account password.  Example: "4ylahjl" |
| server | query | Yes | string | Source account server name (as seen in MT Terminal).  Example: "FreshForex-Demo" |
| apiId | query | No | string | Not required |

**Responses:**
- `200`: Account ID
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /RemoveAccount
**Summary:** Removes a trading account by its account ID.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | The unique account ID (MongoDB document ID). |
| userKey | query | Yes | string | The user key of the requester. |

**Responses:**
- `200`: OK
- `404`: Account not found
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /RemoveAccountByApiId
**Summary:** Removes a trading account by its API ID.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| apiId | query | Yes | string | The unique API ID of the account to remove. |
| userKey | query | Yes | string | The user key of the requester. |

**Responses:**
- `200`: OK
- `404`: Account not found
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /Accounts
**Summary:** Retrieves all accounts for the specified user key without testing connection for each.  Returns an array of tradecopy.Functions.Account objects.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The user key associated with the account list to retrieve. |

**Responses:**
- `200`: <a href="#model-AccountResult">AccountResult</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /GetAccount
**Summary:** Returns an account by its internal Account Id.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | The internal Account Id. |

**Responses:**
- `200`: OK
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /UpdateAccount
**Summary:** Updates the specified account's name and balance consideration flag. Also updates associated copier names by calling /UpdateAccountName for matching copiers.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | The ID of the account to update. |
| accountName | query | Yes | string | The new name for the account. |
| considerAccountBalance | query | Yes | boolean | Whether the copier should consider account balance. |

**Responses:**
- `200`: Account updated successfully.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /AccountSetEnabled
**Summary:** Sets the enabled status of a specific account.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | The ID of the account to update. |
| enabled | query | No | boolean | The desired enabled status. |

**Responses:**
- `200`: Account enabled status updated successfully.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /AccountWithSummary
**Summary:** Retrieves a specific account by user key and account ID, and tests the connection. Returns an tradecopy.AccountResult object with connection status and details.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The user key associated with the account. |
| accountId | query | Yes | string | The ID of the account to retrieve. |

**Responses:**
- `200`: <a href="#model-AccountResult">AccountResult</a>
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /AccountWithTradeSummary
**Summary:** Retrieves a specific account by user key and account ID, and tests the connection. Returns an tradecopy.AccountResult object with connection status and details.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The user key associated with the account. |
| accountId | query | Yes | string | The ID of the account to retrieve. |

**Responses:**
- `200`: <a href="#model-AccountResult">AccountResult</a>
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /AccountsWithSummary
**Summary:** Retrieves all accounts for the specified user key and tests connection for each. Returns an array of tradecopy.AccountResult objects with connection status and details.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The user key associated with the account list to retrieve. |

**Responses:**
- `200`: <a href="#model-AccountResult">AccountResult</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /AccountsWithTradeSummary
**Summary:** Retrieves all accounts for the specified user key and tests connection for each. Returns an array of tradecopy.AccountResult objects with connection status and details.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The user key associated with the account list to retrieve. |

**Responses:**
- `200`: <a href="#model-AccountResult">AccountResult</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /ChangePassword
**Summary:** Changes the password of an MT4 or MT5 trading account using internal account id (DB id).

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| type | query | Yes | string `[MT5, MT4]` | API type (MT4 or MT5) |
| accountId | query | Yes | string | Internal account id in database |
| newPassword | query | Yes | string | New password to apply |
| isInvestor | query | No | boolean | `true` to change investor password; `false` to change master password.              If changing the master password, the session will be disconnected and require reconnection. |

**Responses:**
- `200`: Password changed successfully.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /ChangePasswordByApiId
**Summary:** Changes the password of an MT4 or MT5 trading account.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| type | query | Yes | string `[MT5, MT4]` | API type (MT4 or MT5) |
| apiId | query | Yes | string | API token of the account (returned from Connect) |
| newPassword | query | Yes | string | New password to apply |
| isInvestor | query | No | boolean | `true` to change investor password; `false` to change master password.              If changing the master password, the session will be disconnected and require reconnection. |

**Responses:**
- `200`: Password changed successfully.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

## Copiers / Copy Engine

### GET /StartByAccountId
**Summary:** Starts a copier between two existing accounts using their account IDs (masterAccountId and slaveAccountId). This endpoint links a master account to a slave account and configures all copier behavior including  risk parameters, trade copying rules, and filtering options.
**Description:** Returns tradecopy.Copy.StartResult containing CopierId, SrcId, and DstId. Throws ExceptionResult on validation or connection failures.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | Yes | string | Manager key for accessing protected copier operations. |
| userKey | query | Yes | string | UserKey from users.mtapi.io portal. Required for authentication. |
| masterAccountId | query | Yes | string | Internal ID of the master account registered in the system.  Example: "ad1c8f27-4a3a-4c9b-bbc3-bf63ef0a9e91" |
| slaveAccountId | query | Yes | string | Internal ID of the slave account registered in the system.  Example: "b31f2940-e7e4-4bcb-9c56-2d73edf924ab" |
| riskType | query | Yes | string `[FixedLot, LotMultiplier, BalanceMultiplier, FixedBalanceMultiplier, EquityMultiplier]` | Method used to calculate risk or position sizing.  Options: FixedLot, LotMultiplier, BalanceMultiplier. |
| riskValue | query | Yes | number (double) | Numeric value interpreted based on riskType:  - FixedLot: exact lot size to use    - LotMultiplier: base lot * multiplier    - BalanceMultiplier: balance-proportional sizing |
| copySL | query | No | boolean | If true, copies Stop Loss (SL) from master to slave. |
| copyTP | query | No | boolean | If true, copies Take Profit (TP) from master to slave. |
| fixedSlPips | query | No | integer (int32) | Fixed Stop Loss in pips if SL is not copied.    Set to 0 to disable. |
| fixedTpPips | query | No | integer (int32) | Fixed Take Profit in pips if TP is not copied.    Set to 0 to disable. |
| copyPendingOrders | query | No | boolean | If true, pending orders (BuyLimit, SellLimit, BuyStop, SellStop) are copied. |
| fixedMasterBalance | query | No | number (double) | Artificial master balance used only when using FixedBalanceMultiplier mode. |
| reverseCopy | query | No | boolean | Reverse direction of trades (Buy → Sell, Sell → Buy). |
| stopLossRefinementPips | query | No | integer (int32) | Additional refinement applied to Stop Loss (in pips).  Example: +3 pips or -2 pips. |
| takeProfitRefinementPips | query | No | integer (int32) | Additional refinement applied to Take Profit (in pips). |
| forceMinLot | query | No | boolean | Force usage of minimum allowable lot size if computed lot is too small. |
| forceMaxLot | query | No | boolean | Force usage of maximum allowable lot size if computed lot is too large. |
| copyExistingTrades | query | No | boolean | If true, copies all currently open trades from master to slave on startup. |
| contractAlignment | query | No | boolean | Align contract sizes between master and slave when converting lots. |
| copyExpiryTime | query | No | boolean | Copy expiry time for pending orders (if supported by broker). |
| strictClose | query | No | boolean | Force closing slave orders if master closes, even under mismatch conditions. |
| copyMagicNumber | query | No | string `[No, Yes, Custom]` | Defines how magic numbers are handled. Options:  - No    - Yes    - Custom |
| magicNumber | query | No | integer (int32) | Magic number used when copyMagicNumber = Custom. |
| tradeDelayMs | query | No | integer (int32) | Delay (in milliseconds) before placing slave trades.  Useful for execution spreading or latency control. |
| lotRefiner | query | No | number (double) | Lot size refinement multiplier.    Example: 0.95 reduces final lot size by 5%. |
| filterMagicOption | query | No | string `[None, Copy, Ignore]` | Filtering method by magic number: Copy, Ignore, or None. |
| filterMagicValue | query | No | integer (int32) | Magic number used when filtering by magic number. |
| filterCommentOption | query | No | string `[None, Copy, Ignore]` | Filtering method by comment: Copy, Ignore, or None. |
| filterCommentValue | query | No | string | Text string to filter order comments.  Example: "EA123", "Grid", "Manual". |
| filterSide | query | No | string `[CopyAll, CopyBuyOnly, CopySellOnly]` | Filter trades by direction:  CopyAll, BuyOnly, SellOnly. |
| filterLotEnabled | query | No | boolean | Enable filtering by lot size boundaries. |
| filterLotMin | query | No | number (double) | Minimum allowed lot size when lot filtering is enabled. |
| filterLotMax | query | No | number (double) | Maximum allowed lot size when lot filtering is enabled. |

**Responses:**
- `200`: <a href="#model-StartResult">StartResult</a>
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /Remove
**Summary:** Stop copying and remove copier

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | Token returned by 'Connect' method |
| closeTrades | query | No | boolean | Close trades placed by copier |

**Responses:**
- `200`: OK
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /UserCopiers
**Summary:** List of your running copiers

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | UserKey form users.mtapi.io portal. Please register for free. |

**Responses:**
- `200`: <a href="#model-CopyService">CopyService</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /GetCopier
**Summary:** Get copier by id

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | Copier id |

**Responses:**
- `200`: OK
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /UpdateCopier
**Summary:** Updates copier settings in the database and notifies the running instance (if any) to apply new configuration. This endpoint is used for live copier updates initiated by users.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | No | string |  |
| userKey | query | Yes | string | The user key used to scope and authorize the copier update. |
| riskType | query | Yes | string `[FixedLot, LotMultiplier, BalanceMultiplier, FixedBalanceMultiplier, EquityMultiplier]` | The risk calculation strategy to use (e.g., FixedLot, LotMultiplier, BalanceMultiplier). |
| riskValue | query | Yes | number (double) | The risk parameter value used according to the specified riskType. |
| riskMultiply | query | No | number (double) | Deprecated. Optional proportional multiplier for backward compatibility. |
| copySL | query | No | boolean | Whether to copy stop loss values from master to slave. |
| copyTP | query | No | boolean | Whether to copy take profit values from master to slave. |
| fixedSlPips | query | No | integer (int32) | Fixed stop loss in pips (only used if copySL is false). |
| fixedTpPips | query | No | integer (int32) | Fixed take profit in pips (only used if copyTP is false). |
| copyPendingOrders | query | No | boolean | If true, pending orders are copied from master to slave. |
| fixedMasterBalance | query | No | number (double) | Override balance used for risk calculations. Set to 0 to use live balance. |
| reverseCopy | query | No | boolean | If true, reverses trade direction (e.g., buy becomes sell). |
| stopLossRefinementPips | query | No | integer (int32) | Adds refinement to stop loss values in pips. |
| takeProfitRefinementPips | query | No | integer (int32) | Adds refinement to take profit values in pips. |
| forceMinLot | query | No | boolean | Forces minimum lot size compliance on slave account. |
| forceMaxLot | query | No | boolean | Forces maximum lot size compliance on slave account. |
| contractAlignment | query | No | boolean | Align contract sizes when calculating lot size between accounts. |
| copyExpiryTime | query | No | boolean | Whether to copy expiry time for pending orders. |
| strictClose | query | No | boolean | Enables strict close behavior to synchronize trade closure. |
| copyMagicNumber | query | No | string `[No, Yes, Custom]` | Controls whether and how magic numbers are copied. |
| magicNumber | query | No | integer (int32) | Custom magic number to assign to copied trades. |
| tradeDelayMs | query | No | integer (int32) | Delay in milliseconds before placing a copied trade. |
| lotRefiner | query | No | number (double) | Multiplier applied to the calculated lot size to refine final volume. |
| filterMagicOption | query | No | string `[None, Copy, Ignore]` |  |
| filterMagicValue | query | No | integer (int32) |  |
| filterCommentOption | query | No | string `[None, Copy, Ignore]` |  |
| filterCommentValue | query | No | string |  |
| filterSide | query | No | string `[CopyAll, CopyBuyOnly, CopySellOnly]` |  |
| filterLotEnabled | query | No | boolean |  |
| filterLotMin | query | No | number (double) |  |
| filterLotMax | query | No | number (double) |  |

**Responses:**
- `200`: Copier updated successfully.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /CopierPause
**Summary:** Pauses or unpauses a copier instance by updating its status in the database and notifying the running instance.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | The unique identifier of the copier to pause or unpause. |
| paused | query | Yes | boolean | True to pause the copier; false to resume it. |
| reason | query | No | string `[None, WrongMasterPassword, ByUser, EquityProtection, ConnotConnectMaster, WrongSlavePassword, ConnotConnectSlave, MasterAccountDisable, SlaveAccountDisable]` | Pause reason |

**Responses:**
- `200`: Copier pause status updated successfully.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

## Orders

### GET /OpenOrders
**Summary:** Retrieves all opened orders for a given account ID.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | The ID of the account to retrieve opened orders for. This is a required parameter. |

**Responses:**
- `200`: <a href="#model-Order">Order</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /OpenOrdersAll
**Summary:** Retrieves all opened orders grouped by account names and user identifiers for a specific user.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The unique identifier for the user whose accounts' orders are to be retrieved. |

**Responses:**
- `200`: List of opened orders by user with separate account name and user fields
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /ClosedOrders
**Summary:** Retrieves closed orders for a specific account within a date range.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string |  |
| from | query | Yes | string (date-time) |  |
| to | query | Yes | string (date-time) |  |

**Responses:**
- `200`: <a href="#model-Order">Order</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /ClosedOrdersAll
**Summary:** Retrieves all closed orders for all of a user's accounts within a specified date range. Accounts that fail during the request are ignored.
**Description:** This endpoint gathers closed orders in parallel across all accounts linked to the specified user. Any individual account that throws an error will be silently skipped to allow others to complete.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The unique key identifying the user whose account orders are to be retrieved. |
| from | query | Yes | string (date-time) | The start date of the date range to filter closed orders. |
| to | query | Yes | string (date-time) | The end date of the date range to filter closed orders. |

**Responses:**
- `200`: <a href="#model-AccountOrdersResult">AccountOrdersResult</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

## Trade Statistics & Reports

### GET /TradeStatsByAccountId
**Summary:** Returns StatsResult that contains calculated parameters and charts.
**Description:** Returns StatsResult that contains calculated parameters and charts.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | Internal account identifier. |
| from | query | No | string (date-time) | Start date for the statistics (format: yyyy-MM-ddTHH:mm:ss). |
| excludeSameBars | query | No | boolean | Optional flag to exclude consecutive bars with the same data. Defaults to `true`. |

**Responses:**
- `200`: <a href="#model-StatsWithCharts">StatsResult</a> object
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /TradeStatsByApiId
**Summary:** Returns StatsResult that contains calculated parameters and charts.
**Description:** Returns StatsResult that contains calculated parameters and charts.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| apiId | query | Yes | string | API ID. |
| type | query | Yes | string `[MT5, MT4]` | API type |
| from | query | No | string (date-time) | Start date for the statistics (format: yyyy-MM-ddTHH:mm:ss). |
| excludeSameBars | query | No | boolean | Optional flag to exclude consecutive bars with the same data. Defaults to `true`. |

**Responses:**
- `200`: <a href="#model-StatsWithCharts">StatsWithCharts</a> object
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /TradeStatsWithoutCharts
**Summary:** Returns Stats that contains calculated parameters.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| apiId | query | Yes | string | API ID. |
| type | query | Yes | string `[MT5, MT4]` | API type |
| from | query | No | string (date-time) | Start date for the statistics (format: yyyy-MM-ddTHH:mm:ss). |

**Responses:**
- `200`: <a href="#model-Stats">Stats</a> object
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /TradeReportByUser
**Summary:** Builds a closed-trades report for a user by joining TradeLogs (slave tickets) with account order history fetched in bulk per account.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The required user key to identify the user for the report. |
| from | query | No | string (date-time) | The start date and time for the report period. Defaults to 7 days ago if not specified. |
| to | query | No | string (date-time) | The end date and time for the report period. Defaults to the current time if not specified. |
| server | query | No | string | The server identifier for the trade data source (optional). |
| type | query | No | string | The type of account to filter the report. Valid values are "real", "demo", or "contest" (optional). |
| slaveBrokerCompany | query | No | string | The slave broker company identifier (optional). |

**Responses:**
- `200`: <a href="#model-TradeCloseReportRow">TradeCloseReportRow</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /TradeReportByUserCsv
**Summary:** Builds a closed-trades report for a user by joining TradeLogs (slave tickets) with account order history fetched in bulk per account and returns it as a CSV file.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | The required user key to identify the user for the report. |
| from | query | No | string (date-time) | The start date and time for the report period. Defaults to 7 days ago if not specified. |
| to | query | No | string (date-time) | The end date and time for the report period. Defaults to the current time if not specified. |
| server | query | No | string | The server identifier for the trade data source (optional). |
| type | query | No | string | The type of account to filter the report. Valid values are "real", "demo", or "contest" (optional). |
| slaveBrokerCompany | query | No | string | The slave broker company identifier (optional). |

**Responses:**
- `200`: Returns csv file
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /TradeReportByManager
**Summary:** Builds a closed-trades report for a manager by joining TradeLogs (slave tickets) with account order history fetched in bulk per account.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | Your own report id. |
| managerKey | query | Yes | string | The required manager key to identify the manager for the report. |
| from | query | No | string (date-time) | The start date and time for the report period. Defaults to 7 days ago (September 17, 2025, 01:43 AM CEST) if not specified. |
| to | query | No | string (date-time) | The end date and time for the report period. Defaults to the current time (September 24, 2025, 01:43 AM CEST) if not specified. |
| server | query | No | string | The server identifier for the trade data source (optional). |
| type | query | No | string | The type of account to filter the report. Valid values are "real", "demo", or "contest" (optional). |
| slaveBrokerCompany | query | No | string | The slave broker company identifier (optional). |
| email | query | No | string | Email to send result (optional). |

**Responses:**
- `200`: Returns a CSV file containing the closed-trades report for the manager.
- `201`: Returns an tradecopy.ExceptionResult if an error occurs during report generation.

---

### GET /TradeReportByManagerCsv
**Summary:** Builds a closed-trades report for a manager by joining TradeLogs (slave tickets) with account order history fetched in bulk per account and returns it as a CSV file.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | Your own report id. |
| managerKey | query | Yes | string | The required manager key to identify the manager for the report. |
| from | query | No | string (date-time) | The start date and time for the report period. Defaults to 7 days ago (September 17, 2025, 01:42 AM CEST) if not specified. |
| to | query | No | string (date-time) | The end date and time for the report period. Defaults to the current time (September 24, 2025, 01:42 AM CEST) if not specified. |
| server | query | No | string | The server identifier for the trade data source (optional). |
| type | query | No | string | The type of account to filter the report. Valid values are "real", "demo", or "contest" (optional). |
| slaveBrokerCompany | query | No | string | The slave broker company identifier (optional). |
| email | query | No | string | Email to send report when ready (optional). |

**Responses:**
- `200`: Returns a CSV file containing the closed-trades report for the manager.
- `201`: Returns an tradecopy.ExceptionResult if an error occurs during report generation.

---

### GET /TradeReportStatus

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | No | string |  |

**Responses:**
- `200`: Success
- `201`: Created

---

## Logs

### GET /Logs
**Summary:** Copier logs

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | Token returned by 'Connect' method |
| limit | query | No | integer (int32) | Message count limit. It not specified - returns all messages. If specified - retuerns last 'limit' messages. |
| logLevel | query | No | string `[Trace, Debug, Information, Warning, Error, Critical, None]` | Minimum log level to return |

**Responses:**
- `200`: String array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /TradeLogs
**Summary:** Copier trade logs

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| copierId | query | Yes | string | Token (copier id) returned by 'Connect' method |
| limit | query | No | integer (int32) | Record count limit. If not specified - returns all records. If specified - returns last 'limit' records. |

**Responses:**
- `200`: <a href="#model-TradeLog">TradeLog</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /TradeLogsAll
**Summary:** All TradeLogs for a given UserKey

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| userKey | query | Yes | string | UserKey associated with the copier |
| limit | query | No | integer (int32) | Record count limit. If not specified - returns all records. If specified - returns last 'limit' records. |

**Responses:**
- `200`: <a href="#model-TradeLog">TradeLog</a> array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /SetTradeLogCallback
**Summary:** Updates trade logs callback URL for a specific copier.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | The copier ID |
| callbackUrl | query | Yes | string | Callback URL for receiving POSTed  <a href="#model-TradeLog">TradeLog</a>. |

**Responses:**
- `200`: OK
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /TestTradeLogCallback
**Summary:** Sends a test TradeLog payload to the copier's TradeLogCallbackUrl using the same JSON format as the production SendTradeLogCallbackAsync method.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| copierId | query | Yes | string |  |

**Responses:**
- `200`: Test callback sent successfully.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

## Symbol Mapping

### GET /MappedSymbols
**Summary:** Retrieves the manually defined symbol mappings for a specific copier, along with all available master and slave symbols for that copier.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string |  |

**Responses:**
- `200`: Mapped symbols and available symbol lists
- `201`: Exception result

---

### GET /AddSymbolMapping
**Summary:** Adds or updates a symbol mapping on a copier, storing a master-to-slave symbol pair with optional fixed lots.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | The ID of the copier to update. This must refer to a copier document in the database. |
| masterSymbol | query | Yes | string | The master symbol (source) to be mapped. This is the symbol from the master account. |
| slaveSymbol | query | Yes | string | The slave symbol (destination) that the master symbol should be mapped to.  To specify a fixed lot, use the format `SYMBOL__0.1`, e.g., `EURUSDmini__0.2`. |
| slavelots | query | No | number (double) | The fixed lot size to use on the slave account for this mapping. Use `0` to apply dynamic lot sizing. |

**Responses:**
- `200`: OK
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /DeleteSymbolMapping
**Summary:** Deletes a specific symbol mapping from a copier.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| id | query | Yes | string | The ID of the copier from which the mapping should be removed. |
| masterSymbol | query | Yes | string | The master symbol whose mapping is to be deleted. |

**Responses:**
- `200`: OK
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /SymbolList
**Summary:** Returns all symbol names for a trading account, ensuring connection is established first.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| apiId | query | Yes | string | API ID of the trading account. |
| type | query | Yes | string `[MT5, MT4]` | Trading API type (MT4 or MT5). |

**Responses:**
- `200`: String array
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

### GET /SymbolParamsLite
**Summary:** Returns all symbol parameters including Symbol, LotMin, LotMax, and TradeMode.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| apiId | query | Yes | string | The API ID of the trading account. |
| type | query | Yes | string `[MT5, MT4]` | The trading API type (MT4 or MT5). |

**Responses:**
- `200`: List of symbol parameters
- `201`: Exception result

---

### GET /SymbolsEnable
**Summary:** Enables or disables specific symbols for an account.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | Account ID |
| enableAllSymbols | query | Yes | boolean | If true, enables all symbols except those in disabledSymbols |
| on | query | No | array | Symbols to enable (used only if enableAllSymbols is false) |
| off | query | No | array | Symbols to disable (used only if enableAllSymbols is true) |

**Responses:**
- `200`: Symbols updated
- `201`: Error result

---

## Equity Protector

### GET /UpdateEquityProtector
**Summary:** Updates equity protector settings for a given account via query parameters.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | The ID of the account to update |
| enabled | query | No | boolean | Enable or disable equity protection |
| dailyReset | query | No | boolean | Enable daily drawdown reset |
| alert | query | No | boolean | Enable notification alert when triggered |
| disableCopier | query | No | boolean | Disable copier when triggered |
| closeCopiedTrades | query | No | boolean | Close copied trades only |
| closeAllTrades | query | No | boolean | Close all trades |
| stopLossPercent | query | No | number (double) | % drawdown protection |
| stopLossValue | query | No | number (double) | $ value drawdown protection |
| stopLossAbsolute | query | No | number (double) | $ absolute minimum equity |
| takeProfitPercent | query | No | number (double) | % profit protection |
| takeProfitValue | query | No | number (double) | $ value profit protection |
| takeProfitAbsolute | query | No | number (double) | $ absolute maximum equity |

**Responses:**
- `200`: Equity protector updated.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /UpdateEquityProtectorCallback
**Summary:** Updates equity protector settings for a given account via query parameters.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| accountId | query | Yes | string | The ID of the account to update |
| callbackUrl | query | Yes | string | Callback url to accept POST request |

**Responses:**
- `200`: Equity protector updated.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a>

---

### GET /TestEquityProtectorCallback
**Summary:** Tests the equity protection callback URL for a copier by sending test data.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| copierId | query | Yes | string | The ID of the copier whose callback to test. |

**Responses:**
- `200`: Test callback sent successfully.
- `201`: <a href="#model-ExceptionResult">ExceptionResult</a> array

---

## Manager / Admin

### GET /Manager/Users

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| search | query | No | string |  |
| page | query | No | integer (int32) |  |
| pageSize | query | No | integer (int32) |  |

**Responses:**
- `200`: Success

---

### GET /Manager/Accounts

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| search | query | No | string |  |
| page | query | No | integer (int32) |  |
| pageSize | query | No | integer (int32) |  |

**Responses:**
- `200`: Success

---

### GET /Manager/UserAccounts

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| userKey | query | No | string |  |

**Responses:**
- `200`: Success

---

### GET /Manager/Copiers

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| page | query | No | integer (int32) |  |
| pageSize | query | No | integer (int32) |  |
| showOnlyPaused | query | No | boolean |  |

**Responses:**
- `200`: Success

---

### GET /Manager/UserCopiers

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| userKey | query | No | string |  |
| showOnlyPaused | query | No | boolean |  |

**Responses:**
- `200`: Success

---

### GET /Manager/RemovedCopiers

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| page | query | No | integer (int32) |  |
| pageSize | query | No | integer (int32) |  |

**Responses:**
- `200`: Success

---

### GET /Manager/UserRemovedCopiers

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| userKey | query | No | string |  |

**Responses:**
- `200`: Success

---

### GET /Manager/TogglePauseCopier

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| copierId | query | No | string |  |
| paused | query | No | boolean |  |
| reason | query | No | string `[None, WrongMasterPassword, ByUser, EquityProtection, ConnotConnectMaster, WrongSlavePassword, ConnotConnectSlave, MasterAccountDisable, SlaveAccountDisable]` |  |

**Responses:**
- `200`: Success

---

### GET /Manager/UnPauseAll

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| reason | query | No | string `[None, WrongMasterPassword, ByUser, EquityProtection, ConnotConnectMaster, WrongSlavePassword, ConnotConnectSlave, MasterAccountDisable, SlaveAccountDisable]` |  |

**Responses:**
- `200`: Success

---

### GET /Manager/UserFailedAddAccounts

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| userKey | query | No | string |  |

**Responses:**
- `200`: Success

---

### GET /Manager/UserFailedStarts

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| userKey | query | No | string |  |

**Responses:**
- `200`: Success

---

### GET /Manager/CopierLogs

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| copierId | query | No | string |  |

**Responses:**
- `200`: Success

---

### GET /Manager/CopierTradeLogs

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| managerKey | query | No | string |  |
| copierId | query | No | string |  |

**Responses:**
- `200`: Success

---

## Utilities

### GET /ServerNames
**Summary:** Retrieves all server names for MT5 brokers.

| Parameter | In | Required | Type | Description |
|-----------|----|----------|------|-------------|
| mt5 | query | No | boolean |  |

**Responses:**
- `200`: Array of server names
- `500`: Error response

---

### GET /ReadMe
**Summary:** readme.md as html

**Responses:**
- `200`: Success

---

## Data Models

### Account
Represents a trading account entity used in the copier system.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| name | string | Display name of the account. |
| considerAccountBalance | boolean | Indicates whether the account's balance should be considered in  portfolio value |
| userKey | string | The user key that owns this account. |
| type | string `[MT5, MT4]` | The type of trading platform (e.g., MT4, MT5). |
| user | integer (int64) | The user number for this account. |
| password | string | The password for accessing the account. |
| server | string | The server name as shown in the trading terminal. |
| apiId | string | The API identifier used to connect with external services. |
| id | string | Unique identifier of the account (MongoDB document ID). |
| enabled | boolean | Indicates whether the account is currently enabled. |
| equityProtector | EquityProtectorSettings |  |
| symbolEnableSettings | SymbolEnableSettings |  |
| managerKey | string | The manager key associated with this account, used for linking to a manager entity. |

---

### AccountDetails
Common account details fields present in both MT4 and MT5 responses.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| serverName | string | Server name. |
| user | string | Account number. |
| password | string | Account password. |
| host | string | Host. |
| port | integer (int32) | Port. |
| serverTime | string (date-time) | Server time (UTC). |
| serverTimeZone | integer (int32) | Server timezone offset (in hours). |
| company | string | Broker company name. |
| currency | string | Account currency. |
| accountName | string | Account name. |
| group | string | Account group. |
| accountType | string | Account type (e.g., Real, Demo, Contest). |
| accountLeverage | integer (int32) | Account leverage. |
| isInvestor | boolean | Indicates if the password is investor (read-only). |

---

### AccountOrdersResult
Represents the orders associated with a specific account.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| name | string | Name of the account. |
| user | string | User number associated with the account. |
| id | string | ID |
| apiId | string | API ID |
| orders | array of Order | List of opened orders for the account. |

---

### AccountResult
Represents the result of an account query or operation.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| name | string | Display name of the account. |
| considerAccountBalance | boolean | Indicates whether the account's balance should be considered in  portfolio value |
| userKey | string | The user key that owns this account. |
| type | string `[MT5, MT4]` | The type of trading platform (e.g., MT4, MT5). |
| user | integer (int64) | The user number for this account. |
| password | string | The password for accessing the account. |
| server | string | The server name as shown in the trading terminal. |
| apiId | string | The API identifier used to connect with external services. |
| connected | boolean | Gets or sets a value indicating whether the account is currently connected. |
| connectError | ExceptionResult |  |
| accountSummary | AccountSummary |  |
| tradeSummary | TradeSummary |  |
| accountDetails | AccountDetails |  |
| id | string | Unique identifier of the account (MongoDB document ID). |
| enabled | boolean | Indicates whether the account is currently enabled. |
| equityProtector | EquityProtectorSettings |  |
| symbolEnableSettings | SymbolEnableSettings |  |
| managerKey | string | The manager key associated with this account, used for linking to a manager entity. |

---

### AccountSummary
Common account summary trading information fields present in both MT4 and MT5 responses.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| balance | number (double) | Balance. |
| credit | number (double) | Credit. |
| profit | number (double) | Profit. |
| equity | number (double) | Equity. |
| margin | number (double) | Used margin. |
| freeMargin | number (double) | Free margin. |
| marginLevel | number (double) | Margin percent. |
| leverage | number (double) | Leverage. |
| currency | string | Currency. |
| type | string | Account type (Real, Demo, Contest). |
| isInvestor | boolean | Investor mode (true if investor password is used). |

---

### AveragePipsUsd
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| averagePips | number (double) | Average pips per trade. |
| averageUsd | number (double) | Average USD profit/loss per trade. |

---

### CloudUser
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| id | string |  |
| email | string |  |
| passwordHash | string |  |
| createByCopier | boolean |  |
| createdAt | string (date-time) |  |
| passwordResetKey | string |  |
| balance | number (double) |  |
| invoices | array of Invoice |  |
| logs | array of string |  |
| managerKey | string |  |

---

### CopyService
Represents an active or configured trade copier between a master and a slave trading account.
Contains configuration, symbol mapping, and runtime information.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| userKey | string | The user key that owns this copier session. |
| masterAccountId | string | Master account ID. |
| slaveAccountId | string | Slave account ID. |
| uniqueCopierId | string | A unique hash string representing the configuration of the copier (master/slave combination). |
| masterType | string `[MT5, MT4]` | The account type of the master (e.g., MT4 or MT5). |
| masterUser | integer (int64) | The user number of the master account. |
| masterPassword | string | The password used to connect to the master account. |
| masterServer | string | The server name for the master account. |
| masterApiId | string | The unique API ID for the master account. |
| masterName | string | A friendly name assigned to the master account. |
| slaveType | string `[MT5, MT4]` | The account type of the slave (e.g., MT4 or MT5). |
| slaveUser | integer (int64) | The user number of the slave account. |
| slavePassword | string | The password used to connect to the slave account. |
| slaveServer | string | The server name for the slave account. |
| slaveApiId | string | The unique API ID for the slave account. |
| slaveName | string | A friendly name assigned to the slave account. |
| copySL | boolean | Indicates whether Stop Loss values should be copied from master to slave. |
| copyTP | boolean | Indicates whether Take Profit values should be copied from master to slave. |
| fixedSlPips | integer (int32) | A fixed SL in pips to apply on the slave account if CopySL is false. |
| fixedTpPips | integer (int32) | A fixed TP in pips to apply on the slave account if CopyTP is false. |
| riskType | string `[FixedLot, LotMultiplier, BalanceMultiplier, FixedBalanceMultiplier, EquityMultiplier]` | The risk calculation type used (FixedLot, LotMultiplier, BalanceMultiplier). |
| riskValue | number (double) | The value used in the selected risk model (e.g., lot size or multiplier). |
| riskMultiply | number (double) | If used, overrides risk model with a legacy-style risk multiplier (obsolete). |
| timeLoadingStarted | string (date-time) | Timestamp when the copier began loading. |
| timeLoaded | string (date-time) | Timestamp when the copier finished loading successfully. |
| masterAccountSummary | AccountSummary |  |
| slaveAccountSummary | AccountSummary |  |
| copyPendingOrders | boolean | Copy pending orders from master to slave. |
| reverseCopy | boolean | Reverse buy to sell and sell to buy |
| stopLossRefinementPips | integer (int32) | Refinement pips for stop loss and take profit. |
| takeProfitRefinementPips | integer (int32) | Refinement pips for take profit. |
| fixedMasterBalance | number (double) | Fixed Master balance for RiskType.FixedBalanceMultiplier. |
| forceMinLot | boolean | Enforces the minimum lot size as defined by the slave broker's symbol settings. |
| forceMaxLot | boolean | Enforces the maximum lot size as defined by the slave broker's symbol settings. |
| copyExistingTrades | boolean | If true, any existing open trades on the master will be copied immediately when the copier starts. |
| contractAlignment | boolean | Enables contract size alignment when calculating lot equivalence between master and slave accounts. |
| copyExpiryTime | boolean | If true, copies expiry time of pending orders from master to slave. |
| strictClose | boolean | Forces slave trades to close strictly when the master trade is closed, even if no SL/TP is set. |
| copyMagicNumber | string `[No, Yes, Custom]` | Determines how the copier handles magic numbers on slave trades (None, Copy, Custom). |
| magicNumber | integer (int32) | Custom magic number to apply to trades if tradecopy.CopyService.CopyMagicNumber is set to Custom. |
| tradeDelayMs | integer (int32) | Delay (in milliseconds) before placing a copied trade on the slave account. |
| lotRefiner | number (double) | Multiplier applied to the calculated lot size to refine the final volume (e.g., 0.95 for 95%). |
| filterMagicOption | string `[None, Copy, Ignore]` | Specifies how to filter trades based on magic number (Copy, Ignore, None). |
| filterMagicValue | integer (int32) | The magic number value used for filtering trades when tradecopy.CopyService.FilterMagicOption is active. |
| filterCommentOption | string `[None, Copy, Ignore]` | Specifies how to filter trades based on comment content (Copy, Ignore, None). |
| filterCommentValue | string | The comment text used to filter trades when tradecopy.CopyService.FilterCommentOption is active. |
| filterSide | string `[CopyAll, CopyBuyOnly, CopySellOnly]` | Determines which trade directions are allowed (All, Buy-only, Sell-only). |
| filterLotEnabled | boolean | Enables filtering trades based on their lot size. |
| filterLotMin | number (double) | Minimum allowed lot size when tradecopy.CopyService.FilterLotEnabled is true. |
| filterLotMax | number (double) | Maximum allowed lot size when tradecopy.CopyService.FilterLotEnabled is true. |
| paused | boolean | Pauses the copier, preventing any new trades from being copied. |
| pauseReason | string `[None, WrongMasterPassword, ByUser, EquityProtection, ConnotConnectMaster, WrongSlavePassword, ConnotConnectSlave, MasterAccountDisable, SlaveAccountDisable]` | Pause reason |
| tradeLogCallbackUrl | string | Callback url to get trade logs updates |
| unmappedSymbols | array of string |  |
| mappedSymbols | object | A parsed and normalized version of !:SymbolMapping, used during copier runtime. |
| loaded | boolean | Copier started in cluster |
| id | string | Unique ID of the copier instance. Also used as the MongoDB document ID. |
| lastLoadFailedUtc | string (date-time) | Last UTC time copier failed to start |
| equityProtector | EquityProtectorSettings |  |
| lastDailyResetUtc | string (date-time) |  |
| managerKey | string | Manager key for accessing protected copier operations. |

---

### EquityPoint
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| time | string (date-time) | Time of the equity point. |
| balance | number (double) | Account balance at that time. |
| equity | number (double) | Account equity at that time. |
| balanceDrawdownRaw | number (double) | Raw balance drawdown. |
| balanceDrawdownRelative | number (double) | Relative balance drawdown. |
| equityDrawdownRaw | number (double) | Raw equity drawdown. |
| equityDrawdownRelative | number (double) | Relative equity drawdown. |
| realizedPL | number (double) | Realized profit/loss. |
| unrealizedPL | number (double) | Unrealized profit/loss. |

---

### EquityProtectorSettings
Represents the configuration for equity protection on a trading account.
Used to define risk-based triggers and actions like disabling the copier or closing trades.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| enabled | boolean | Indicates whether equity protection is enabled. |
| dailyReset | boolean | Enables daily reset of drawdown tracking.  When true, drawdown thresholds are reset at the start of each day. |
| alert | boolean | Sends a notification alert when equity protection is triggered. |
| disableCopier | boolean | Disables the trade copier for this account when equity protection is triggered. |
| closeCopiedTrades | boolean | Closes only the trades that were opened by the trade copier when equity protection is triggered. |
| closeAllTrades | boolean | Closes all open trades on the account when equity protection is triggered. |
| stopLossPercent | number (double) | The percentage-based drawdown threshold at which protection will trigger (e.g., 5%). |
| stopLossValue | number (double) | The fixed monetary value drawdown threshold (in account currency) that triggers protection. |
| stopLossAbsolute | number (double) | The minimum absolute equity (in account currency) allowed before protection triggers. |
| takeProfitPercent | number (double) | The percentage-based profit threshold at which take-profit protection will trigger. |
| takeProfitValue | number (double) | The fixed monetary gain (in account currency) that triggers take-profit protection. |
| takeProfitAbsolute | number (double) | The maximum absolute equity ceiling (in account currency) above which protection triggers. |
| callbackUrl | string | The callback URL to notify when an equity protection event is triggered. |
| startBalance | number (double) | Start balance at enable moment |

---

### ExceptionResult
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| message | string |  |
| code | string |  |
| stackTrace | string |  |

---

### Expectancy
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| pips | number (double) | Expected value in pips. |
| dollar | number (double) | Expected value in USD. |

---

### Invoice
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| id | string |  |
| amount | number (double) |  |
| time | string (date-time) |  |
| url | string |  |
| paid | boolean |  |

---

### MappedSymbol
Represents a mapping between a master account symbol and a corresponding slave account symbol,
including an optional fixed lot size for copying trades.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| masterSymbol | string | The source symbol from the master trading account. |
| slaveSymbol | string | The destination symbol on the slave trading account. |
| slaveLots | number (double) | The fixed lot size to be used on the slave account when copying this symbol.  If set to 0, dynamic risk-based lot sizing is assumed. |

---

### MappedSymbolsResult
Represents the response of GetMappedSymbols API, including mappings and available symbols.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| mappedSymbols | array of MappedSymbol | A dictionary of manually defined symbol mappings (master → slave). |
| masterSymbols | array of string | All symbols available in the master account. |
| slaveSymbols | array of string | All symbols available in the slave account. |

---

### MarketTradeCount
Represents the number of trades executed for a specific market symbol
from the inception of the account.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| marketName | string | Gets or sets the name of the market symbol (e.g., "EURUSD-", "GBPJPY-"). |
| count | integer (int32) | Gets or sets the total number of trades for the specified market symbol. |

---

### Order
Contains order data.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| ticket | integer (int64) | Ticket number. |
| openTime | string (date-time) | Open time. |
| closeTime | string (date-time) | Close time. Just for history orders. |
| expiration | string (date-time) | Expiration time of pending order. |
| type | string `[Buy, Sell, BuyLimit, SellLimit, BuyStop, SellStop, BuyStopLimit, SellStopLimit, CloseBy, Balance, Credit]` | Order type. |
| lots | number (double) | Amount of lots. Be careful some brokers use non-standard lots. |
| symbol | string | Trading instrument. |
| openPrice | number (double) | Open price. |
| stopLoss | number (double) | Stop loss. |
| takeProfit | number (double) | Take profit. |
| closePrice | number (double) | Close price. Just for history orders. |
| magicNumber | integer (int64) | Identifying (magic) number. |
| swap | number (double) | Swap value. |
| commission | number (double) | Commission value. |
| comment | string | Order comment. |
| profit | number (double) | Net profit value (without swaps or commissions) in base currency. |
| digits | integer (int32) | Number of digits after decimal point in the symbol price. |

---

### PeriodDto
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| from | string (date-time) |  |
| to | string (date-time) |  |

---

### ProfitData
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| tiket | integer (int64) | Trade ticket ID. |
| date | string (date-time) | Date of the trade. |
| profit | number (double) | Profit from the trade. |

---

### Profitability
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| wonTrades | integer (int64) | Total number of won trades. |
| wonTradesPercent | number (double) | Percentage of won trades. |
| lostTrades | integer (int64) | Total number of lost trades. |
| lostTradesPercent | number (double) | Percentage of lost trades. |

---

### StartResult
Result of start function
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| copierId | string | Copier token |
| masterAccountId | string | Master account id |
| slaveAccountId | string | Destination account api token |
| srcId | string | Slave account id |
| dstId | string | Destination account api token |

---

### Stats
Trading statystics
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| summary | TradeSummary |  |
| markets | array of MarketTradeCount | Gets or sets the trade counts grouped by market symbol  from the inception of the account. |
| maxBalanceDrawdownRaw | number (double) | Maximum raw balance drawdown. |
| maxBalanceDrawdownRelative | number (double) | Maximum relative balance drawdown. |
| maxEquityDrawdownRaw | number (double) | Maximum raw equity drawdown. |
| maxEquityDrawdownRelative | number (double) | Maximum relative equity drawdown. |
| profitability | Profitability |  |
| pips | number (double) | Total pips earned. |
| lots | number (double) | Total lots traded. |
| comissions | number (double) | Total commissions. |
| averageWin | AveragePipsUsd |  |
| averageLost | AveragePipsUsd |  |
| longsWon | Won |  |
| shortsWon | Won |  |
| bestTrade | ProfitData |  |
| worstTrade | ProfitData |  |
| bestTradePips | ProfitData |  |
| worstTradePips | ProfitData |  |
| averageTradeLength | string | Average duration of a trade. |
| profitFactor | number (double) | Profit factor. |
| standardDeviation | number (double) | Standard deviation of returns. |
| sharpeRatio | number (double) | Sharpe ratio. |
| zScore | ZScore |  |
| expectancy | Expectancy |  |
| ghpr | number (double) | Geometric holding period return (GHPR). |
| trades | integer (int64) | Total number of trades. |

---

### StatsWithCharts
Equity history with trading statistics.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| stats | Stats |  |
| charts | array of EquityPoint | Equity history chart points. |

---

### SymbolEnableSettings
Represents symbol access control for a trading account, allowing selective enable/disable rules.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| enableAllSymbols | boolean | Determines the default symbol access strategy:  <list type="bullet"><item><description>`true`: All symbols are enabled except those listed in tradecopy.SymbolEnableSettings.DisabledSymbols.</description></item><item><description>`false`: All symbols are disabled except those listed in tradecopy.SymbolEnableSettings.EnabledSymbols.</description></item></list> |
| enabledSymbols | array of string | Array of symbols explicitly enabled.  Used only when tradecopy.SymbolEnableSettings.EnableAllSymbols is `false`. |
| disabledSymbols | array of string | Array of symbols explicitly disabled.  Used only when tradecopy.SymbolEnableSettings.EnableAllSymbols is `true`. |

---

### SymbolLite
Simplified symbol information for trading purposes.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| symbol | string | Symbol name (e.g., EURUSD, XAUUSD). |
| lotMin | number (double) | Minimum allowed lot size for this symbol. |
| lotMax | number (double) | Maximum allowed lot size for this symbol. |
| tradeMode | string `[Disabled, LongOnly, ShortOnly, CloseOnly, FullAccess]` | Trade mode for this symbol (e.g., FullAccess, Disabled). |

---

### TradeLog
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| messages | array of TradeLogMessage |  |
| url | string |  |
| masterSlaveDelayOpen | integer (int32) |  |
| masterSlaveDelayClose | integer (int32) |  |
| id | string |  |
| userKey | string |  |
| timeUTC | string (date-time) |  |
| timeDoneUTC | string (date-time) |  |
| copierId | string |  |
| updateType | string `[PendingClose, MarketOpen, PendingOpen, MarketClose, PartialClose, Started, Filled, Cancelling, MarketModify, PendingModify, OnStopLoss, OnTakeProfit, OnStopOut, Balance, Expired, Rejected, MarketCloseBy, MarketCloseNotFound]` | Represents the types of updates that can occur for an order. |
| masterUser | string |  |
| masterServer | string |  |
| masterName | string |  |
| masterOrder | Order |  |
| masterApiType | string `[MT5, MT4]` |  |
| masterApiId | string |  |
| slaveUser | string |  |
| slaveServer | string |  |
| slaveName | string |  |
| slaveSymbol | string |  |
| slaveLots | number (double) |  |
| slaveOrderType | string `[Buy, Sell, BuyLimit, SellLimit, BuyStop, SellStop, BuyStopLimit, SellStopLimit, CloseBy, Balance, Credit]` | Order type |
| slaveApiType | string `[MT5, MT4]` |  |
| slaveApiId | string |  |
| slaveOrder | Order |  |
| uniqueTradeId | string |  |
| exceptionMessage | string |  |
| exceptionCode | string |  |
| exceptionStackTrace | string |  |
| success | boolean |  |
| slaveTicket | string |  |
| slaveType | string |  |
| tradeReason | string `[NewSignal, PeriodicCheck, EquityProtector, MasterConnectFail, CopierRemove]` |  |
| slaveBrokerCompany | string |  |

---

### TradeLogMessage
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| timeUTC | string (date-time) |  |
| level | string `[Verbose, Debug, Information, Warning, Error, Fatal]` |  |
| message | string |  |

---

### TradeReportRow
Represents a single closed trade record in the trade report.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| copierId | string | The unique identifier of the copier that handled this trade. |
| slaveApiType | string `[MT5, MT4]` | The type of the slave account (MT4 or MT5). |
| slaveName | string | The display name of the slave account. |
| slaveUser | string | The login (user number) of the slave account. |
| ticket | string | The unique ticket number of the closed order. |
| symbol | string | The symbol (instrument) traded, e.g. EURUSD, XAUUSD. |
| type | string `[Buy, Sell, BuyLimit, SellLimit, BuyStop, SellStop, BuyStopLimit, SellStopLimit, CloseBy, Balance, Credit]` | The order type (Buy, Sell, BuyLimit, SellLimit, etc.). |
| lots | number (double) | The lot size of the trade. |
| openTime | string (date-time) | The date and time when the order was opened. |
| closeTime | string (date-time) | The date and time when the order was closed. |
| openPrice | number (double) | The price at which the order was opened. |
| closePrice | number (double) | The price at which the order was closed. |
| profit | number (double) | The profit or loss realized from the trade, in account currency. |

---

### TradeReportStatusResponse
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| reportId | string |  |
| status | string |  |
| queuedAt | string (date-time) |  |
| startedAt | string (date-time) |  |
| completedAt | string (date-time) |  |
| progressPercent | number (double) |  |
| processedUsers | integer (int32) |  |
| totalUsers | integer (int32) |  |
| totalTrades | integer (int32) |  |
| period | PeriodDto |  |
| message | string |  |
| data | array of TradeReportRow |  |
| emailSentTo | string |  |

---

### TradeSummary
Represents a summary of trading statistics for an account.
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| openTrades | integer (int32) | Gets or sets the number of currently open trades. |
| openProfit | number (double) | Gets or sets the total profit or loss from currently open trades. |
| dayProfit | number (double) | Gets or sets the profit or loss for the current day. |
| weekProfit | number (double) | Gets or sets the profit or loss for the current week. |
| monthProfit | number (double) | Gets or sets the profit or loss for the current month. |
| totalProfit | number (double) | Gets or sets the total cumulative profit or loss over the account's history. |

---

### Won
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| wonCount | integer (int32) | Number of winning trades. |
| all | integer (int32) | Total number of trades. |
| wonPersent | number (double) | Winning percentage. |

---

### ZScore
**Type:** `object`

| Property | Type | Description |
|----------|------|-------------|
| zScoreDecimal | number (double) | Z-score value (decimal form). |
| zScoreProbability | number (double) | Z-score probability. |

---
