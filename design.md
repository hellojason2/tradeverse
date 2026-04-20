# Tradeverse 2.0 — Design System

> **Source of truth:** Extracted from `design/Tv 2.0/Tradeverse Dashboard.html` (dark) and `design/Tv 2.0/Tradeverse Dashboard Light.html` (light).  
> **Last updated:** 2026-04-20  
> **Applies to:** Every frontend module, every agent, every component. No exceptions.

---

## 0. Agent Quick-Start (Read This First)

**Before you write ANY UI code, you must:**
1. Read this file entirely.
2. Use ONLY the colors, fonts, spacing, and components defined here.
3. If a component you need is not explicitly spec'd, use the **Design Decision Framework** (§13) to build it.
4. Before finishing any page/component, run the **Completion Checklist** (§20).

**If you are unsure about a design decision:**
- Default to dark mode.
- Default to the darker/more subdued option.
- Default to JetBrains Mono for numbers, Instrument Serif for headlines, Inter for everything else.
- When in doubt, open `design/Tv 2.0/Tradeverse Dashboard.html` in a browser and copy the exact pattern.

---

---

## 1. Design Philosophy

- **Dark-first** trading interface. Light mode is secondary.
- **Glassmorphism cards** on deep navy backgrounds.
- **Data-dense** but breathable. Monospace for numbers, serif for headlines, sans for UI.
- **Color-coded semantics**: Green = profit/active, Red = loss/danger, Blue = primary action, Yellow = warning/fundraising, Purple = insurance/special.
- **Animated micro-interactions**: 0.28s cubic-bezier transitions, hover lifts, glowing accents.

---

## 2. Color Palette

### 2.1 Dark Mode (Primary)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-0` | `#030611` | Page background |
| `--bg-1` | `#060a1a` | Elevated surface (sidebar gradient end) |
| `--bg-2` | `#0b1228` | Card surface start, toggle bg |
| `--bg-3` | `#0f1630` | Card surface end |
| `--ink-0` | `#f5f7ff` | Primary text, headings |
| `--ink-1` | `#c9d1e8` | Secondary text, body |
| `--ink-2` | `#8892b0` | Tertiary text, placeholders, muted |
| `--ink-3` | `#545d78` | Disabled, timestamps, borders |
| `--line` | `rgba(255,255,255,0.08)` | Default borders |
| `--line-2` | `rgba(255,255,255,0.14)` | Hover borders, dividers |
| `--line-3` | `rgba(120,160,255,0.22)` | Active borders, focus rings |

**Semantic Colors (OKLCH for glows, hex fallback for static):**

| Token | OKLCH Value | Hex Fallback | Usage |
|-------|-------------|--------------|-------|
| `--blue` | `oklch(0.68 0.19 255)` | `#4f8eff` | Primary action, links, active nav |
| `--blue-2` | `oklch(0.78 0.17 245)` | `#7aadff` | Hover states, focus glow |
| `--blue-3` | `oklch(0.55 0.22 262)` | `#2d6bdc` | Deep accent, gradients |
| `--cyan` | `oklch(0.86 0.12 220)` | `#7ee8ff` | Secondary accent, chart bars |
| `--green` | `oklch(0.72 0.17 150)` | `#3ddc84` | Profit, success, active status |
| `--green-l` | `oklch(0.72 0.17 150 / 0.14)` | `rgba(61,220,132,0.14)` | Success bg tint |
| `--red` | `oklch(0.68 0.22 20)` | `#ff5555` | Loss, danger, error |
| `--red-l` | `oklch(0.68 0.22 20 / 0.14)` | `rgba(255,85,85,0.14)` | Error bg tint |
| `--yellow` | `oklch(0.82 0.15 85)` | `#ffd166` | Warning, fundraising status |
| `--yellow-l` | `oklch(0.82 0.15 85 / 0.14)` | `rgba(255,209,102,0.14)` | Warning bg tint |
| `--purple` | `oklch(0.7 0.2 300)` | `#c77dff` | Insurance, Atlas Gold, special |
| `--purple-l` | `oklch(0.7 0.2 300 / 0.14)` | `rgba(199,125,255,0.14)` | Insurance bg tint |
| `--orange` | `oklch(0.74 0.17 55)` | `#ff9f4d` | Moderate alerts |
| `--orange-l` | `oklch(0.74 0.17 55 / 0.14)` | `rgba(255,159,77,0.14)` | Alert bg tint |

### 2.2 Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-0` | `#f4f6fb` | Page background |
| `--bg-1` | `#ffffff` | Card surface |
| `--bg-2` | `#eef2f9` | Sidebar, input bg |
| `--bg-3` | `#e4eaf4` | Hover bg |
| `--ink-0` | `#0b1228` | Primary text |
| `--ink-1` | `#2a3654` | Secondary text |
| `--ink-2` | `#5c6784` | Tertiary text |
| `--ink-3` | `#8a93ab` | Muted, disabled |
| `--line` | `rgba(11,18,40,0.08)` | Default borders |
| `--line-2` | `rgba(11,18,40,0.14)` | Hover borders |
| `--line-3` | `rgba(60,100,220,0.3)` | Active borders |

Semantic colors in light mode use darker OKLCH values with adjusted opacity for bg tints.

### 2.3 Admin Panel (Optional Variant)

Uses Geist font + white background. See `design/admindashboard.html` for reference. Only use for the admin dashboard, not the client portal.

---

## 3. Typography

### 3.1 Font Families

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **Sans (UI)** | Inter | 400, 500, 600, 700 | Body, nav, buttons, labels |
| **Serif (Display)** | Instrument Serif | 400 (italic) | Headlines, card titles, welcome banner, logo |
| **Mono (Data)** | JetBrains Mono | 400, 500, 600, 700 | Numbers, prices, timestamps, badges, code |

### 3.2 Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Font |
|------|------|--------|-------------|----------------|------|
| Hero Display | `clamp(38px, 5vw, 92px)` | 400 | 0.98 | -0.02em | Instrument Serif |
| Section Title | 26–32px | 400 | 1.05 | -0.01em | Instrument Serif |
| Card Title | 20px | 400 | 1.1 | -0.01em | Instrument Serif |
| Mono Stat | 34px | 400 | 1 | -0.02em | Instrument Serif |
| Body | 13–14px | 400–600 | 1.5 | normal | Inter |
| Label / Mono | 10–11px | 500–600 | 1 | 0.08–0.1em uppercase | JetBrains Mono |
| Micro | 9–10px | 500–700 | 1 | 0.05em | Inter or Mono |

### 3.3 Typography Rules

- **Numbers in currency/monospace:** Always use JetBrains Mono for prices, percentages, balances, lot sizes.
- **Italic serif for emphasis:** Headlines use `<em>` with gradient text fill.
- **Uppercase labels:** All form labels, table headers, stat labels are uppercase + letter-spaced.
- **Color by semantics:**
  - Profit text: `var(--green)`
  - Loss text: `var(--red)`
  - Primary data: `var(--ink-0)`
  - Secondary: `var(--ink-1)`
  - Muted: `var(--ink-2)`

---

## 4. Spacing & Layout

### 4.1 Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sw` | `240px` | Sidebar width |
| `--sc` | `64px` | Sidebar collapsed width |
| `--hh` | `60px` | Topbar height |
| `--ts` | `0.28s` | Default transition duration |
| `--radius` | `14px` | Card radius |

### 4.2 Grid System

| Class | Columns | Gap |
|-------|---------|-----|
| `.g2` | 2 | 16px |
| `.g3` | 3 | 16px |
| `.g4` | 4 | 16px |
| `.g5` | 5 | 16px |
| `.g6` | 6 | 16px |

### 4.3 Spacing Scale

| Token | Value |
|-------|-------|
| `mb1` | 4px |
| `mb2` | 8px |
| `mb3` | 12px |
| `mb4` | 16px |
| `mb6` | 24px |
| `gap2` | 8px |
| `gap3` | 12px |
| `gap4` | 16px |

Content padding: `24px 28px 60px` (desktop), `16px` (mobile).

---

## 5. Component Specifications

### 5.1 Sidebar

- **Position:** Fixed left, full height
- **Background:** `linear-gradient(180deg, rgba(10,15,30,0.85), rgba(6,10,24,0.85))` with `backdrop-filter: blur(24px)`
- **Border-right:** `1px solid var(--line)`
- **Header:** Logo (34px square, gradient bg, border, Instrument Serif text "TV") + brand name "Tradeverse" (Instrument Serif, 20px)
- **Nav sections:** Uppercase label (9px, letter-spacing 0.18em, `--ink-3`), then nav items
- **Nav item:** `padding: 9px 12px`, `border-radius: 9px`, `gap: 12px`, Inter 13px weight 500
  - Default: `color: var(--ink-2)`, hover: `background: rgba(120,160,255,0.06)`, `color: var(--ink-0)`
  - Active: gradient bg (`oklch(0.55 0.22 260 / 0.22)` → `oklch(... / 0.05)`), left glow indicator (3px, `--blue-2`), `box-shadow: inset 0 0 0 1px rgba(120,160,255,0.18)`
- **Nav badge:** Gradient bg, white text, 9px, JetBrains Mono, rounded pill
- **Footer:** User avatar (32px, gradient) + name (12px) + role (10px, uppercase, `--ink-3`)
- **Toggle:** 24px circle, absolute right -12px, rotates 180deg when collapsed
- **Collapsed:** Width = 64px, text hidden, badges hidden

### 5.2 Topbar

- **Height:** 60px
- **Background:** `rgba(6,10,24,0.7)` with `backdrop-filter: blur(24px)`
- **Border-bottom:** `1px solid var(--line)`
- **Left:** Page title (Instrument Serif, 22px) + breadcrumb (11px, uppercase, JetBrains Mono, `--ink-3`)
- **Search:** `width: 260px`, `bg: rgba(255,255,255,0.03)`, `border: 1px solid var(--line)`, `border-radius: 9px`, `padding: 7px 12px`
  - Focus: `border-color: var(--line-3)`, `box-shadow: 0 0 0 3px oklch(0.55 0.22 260 / 0.15)`, `bg: rgba(120,160,255,0.04)`
  - Placeholder: `--ink-3`
  - Cmd+K hint: kbd style (10px, bg `rgba(255,255,255,0.04)`, border `var(--line-2)`)
- **Right buttons:** 36px square, `border-radius: 9px`, `bg: rgba(255,255,255,0.03)`, `border: 1px solid var(--line)`
  - Hover: `color: var(--blue-2)`, `border-color: var(--line-3)`, `bg: rgba(120,160,255,0.08)`
  - Notification dot: 7px, `--blue-2`, with border + glow

### 5.3 Cards

```css
.card {
  background: linear-gradient(180deg, rgba(14,20,44,0.55), rgba(8,12,28,0.55));
  border: 1px solid var(--line);
  border-radius: var(--radius);        /* 14px */
  padding: 20px;
  transition: all var(--ts);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset;
}
.card:hover { border-color: var(--line-2); }
```

- **Card header:** Flex between, margin-bottom 16px
  - Title: Instrument Serif, 20px, `--ink-0`
  - Subtitle: JetBrains Mono, 11px, uppercase, letter-spacing 0.05em, `--ink-3`

**Stat Card:**
- Same base as card but with `::before` radial gradient glow at top-right (`oklch(0.55 0.22 260 / 0.12)`)
- Label: 11px, uppercase, JetBrains Mono, `--ink-3`
- Value: Instrument Serif, 34px, `--ink-0`
- Change badge: inline-flex, padding 3px 9px, `border-radius: 6px`, JetBrains Mono 11px
  - Up: `bg: var(--green-l)`, `color: var(--green)`, border `oklch(... / 0.3)`
  - Down: `bg: var(--red-l)`, `color: var(--red)`, border `oklch(... / 0.3)`

### 5.4 Buttons

| Variant | Background | Text | Border | Shadow |
|---------|-----------|------|--------|--------|
| **Primary (btn-blue)** | `linear-gradient(180deg, oklch(0.7 0.2 255), oklch(0.52 0.22 262))` | white | transparent | inset highlight + drop shadow |
| **Success (btn-green)** | `linear-gradient(180deg, oklch(0.76 0.18 155), oklch(0.55 0.17 150))` | white | transparent | inset + drop shadow |
| **Danger (btn-red)** | `linear-gradient(180deg, oklch(0.72 0.22 25), oklch(0.55 0.22 20))` | white | transparent | none |
| **Ghost (btn-ghost)** | transparent | `--ink-2` | none | padding 7px 14px |
| **Outline (btn-outline)** | `rgba(255,255,255,0.02)` | `--ink-1` | `1px solid var(--line-2)` | none |

- **Base:** `padding: 9px 18px`, `border-radius: 9px`, Inter 12.5px weight 600, `gap: 7px`, inline-flex
- **Hover (gradient):** `filter: brightness(1.1)`
- **Hover (ghost):** `bg: rgba(255,255,255,0.04)`, `color: var(--ink-0)`
- **Hover (outline):** `border-color: var(--line-3)`, `color: var(--ink-0)`, `bg: rgba(120,160,255,0.06)`
- **Small:** `padding: 6px 12px`, `font-size: 11.5px`, `border-radius: 7px`
- **Full width:** `width: 100%`

### 5.5 Badges

```css
.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 6px;
  font-size: 10px; font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.04em; text-transform: uppercase;
  border: 1px solid ...;
}
```

| Class | BG | Text | Border |
|-------|----|------|--------|
| `.b-green` | `var(--green-l)` | `var(--green)` | `oklch(0.72 0.17 150 / 0.3)` |
| `.b-red` | `var(--red-l)` | `var(--red)` | `oklch(0.68 0.22 20 / 0.3)` |
| `.b-blue` | `var(--blue-l)` | `var(--blue-2)` | `var(--line-3)` |
| `.b-yellow` | `var(--yellow-l)` | `var(--yellow)` | `oklch(0.82 0.15 85 / 0.3)` |
| `.b-purple` | `var(--purple-l)` | `var(--purple)` | `oklch(0.7 0.2 300 / 0.3)` |
| `.b-cyan` | `var(--cyan-l)` | `var(--cyan)` | `oklch(0.86 0.12 220 / 0.3)` |
| `.b-orange` | `var(--orange-l)` | `var(--orange)` | `oklch(0.74 0.17 55 / 0.3)` |

**Status dot:** 7px circle, colored with `box-shadow: 0 0 6px [color]`. Used inside badges.

### 5.6 Tables

```css
.tbl {
  width: 100%; border-collapse: collapse;
}
.tbl th {
  text-align: left; font-size: 10px; font-weight: 600;
  color: var(--ink-3); text-transform: uppercase;
  letter-spacing: 0.1em; padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  font-family: 'JetBrains Mono', monospace;
}
.tbl td {
  padding: 14px; font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: var(--ink-1);
}
.tbl tr:hover td { background: rgba(120,160,255,0.04); }
.tbl td.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
```

### 5.7 Forms

**Input (.fi):**
- `width: 100%`, `padding: 10px 14px`
- `background: rgba(255,255,255,0.03)`
- `border: 1px solid var(--line)`, `border-radius: 9px`
- `color: var(--ink-0)`, `font-size: 13px`
- Focus: `border-color: var(--line-3)`, `box-shadow: 0 0 0 3px oklch(0.55 0.22 260 / 0.15)`, `bg: rgba(120,160,255,0.04)`
- Placeholder: `var(--ink-3)`

**Label (.fl):**
- `display: block`, `font-size: 11px`, `font-weight: 500`
- `color: var(--ink-2)`, `margin-bottom: 7px`
- `letter-spacing: 0.08em`, `text-transform: uppercase`
- Font: JetBrains Mono

**Select (.fi.fs):**
- Same as input + custom chevron SVG dropdown arrow
- `appearance: none`, `padding-right: 32px`

**Toggle (.tog-sw):**
- `width: 40px`, `height: 22px`, `border-radius: 11px`
- Off: `bg: rgba(255,255,255,0.06)`, `border: 1px solid var(--line-2)`
- On: gradient bg, `border-color: var(--line-3)`, `box-shadow: 0 0 12px oklch(...)`
- Knob: 16px circle, transitions left 2px → 20px

### 5.8 Tabs

```css
.tabs {
  display: flex; gap: 2px; padding: 3px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--line);
  border-radius: 9px;
  width: fit-content;
}
.tab {
  padding: 7px 14px; border-radius: 7px;
  font-size: 12px; font-weight: 500;
  color: var(--ink-3); cursor: pointer;
  transition: all var(--ts);
}
.tab:hover { color: var(--ink-1); }
.tab.act {
  background: linear-gradient(180deg, oklch(0.55 0.22 260 / 0.3), oklch(0.55 0.22 260 / 0.1));
  color: var(--ink-0);
  box-shadow: inset 0 0 0 1px var(--line-3);
}
```

### 5.9 Avatars

| Size | Width | Radius | Font Size |
|------|-------|--------|-----------|
| Default | 34px | 9px | 11px |
| Small (.av-sm) | 28px | 7px | 10px |
| Large (.av-lg) | 48px | 12px | 15px |

- `font-weight: 700`, JetBrains Mono, white text
- Background: linear gradient (varies by user — use oklch hues)

### 5.10 Progress Bars

```css
.prog {
  width: 100%; height: 5px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px; overflow: hidden;
}
.prog-f {
  height: 100%; border-radius: 3px;
  transition: width 1s ease-out;
}
```

Variants: `.blue`, `.green`, `.yellow`, `.red`, `.purple` — each with gradient fill.

### 5.11 Toasts

```css
.toast {
  padding: 12px 18px; border-radius: 10px;
  font-size: 12px; font-weight: 500;
  display: flex; align-items: center; gap: 10px;
  min-width: 260px; backdrop-filter: blur(20px);
  box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5);
}
```

| Type | BG | Border | Text |
|------|----|--------|------|
| Success (.ok) | `oklch(0.72 0.17 150 / 0.2)` | `oklch(... / 0.4)` | `oklch(0.92 0.1 150)` |
| Error (.err) | `oklch(0.68 0.22 20 / 0.2)` | `oklch(... / 0.4)` | `oklch(0.92 0.12 20)` |
| Info (.inf) | `oklch(0.55 0.22 260 / 0.2)` | `var(--line-3)` | `var(--blue-2)` |

Position: `fixed; top: 78px; right: 28px; z-index: 10000`

### 5.12 Modals

- **Overlay:** `bg: rgba(3,6,17,0.7)`, `backdrop-filter: blur(8px)`
- **Modal:** `max-width: 460px`, `width: 90%`, `border-radius: 16px`, `padding: 26px`
- **Background:** `linear-gradient(180deg, rgba(14,20,44,0.9), rgba(8,12,28,0.9))`
- **Border:** `1px solid var(--line-2)`
- **Shadow:** `0 30px 80px -10px rgba(0,0,0,0.6)`
- **Title:** Instrument Serif, 22px
- **Text:** 13px, `var(--ink-2)`, line-height 1.6
- **Actions:** Flex end, gap 10px

### 5.13 Chart Placeholders

```css
.chart-ph {
  width: 100%; height: 170px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 10px;
  display: flex; align-items: flex-end;
  padding: 14px; gap: 3px;
  position: relative; overflow: hidden;
}
.chart-b {
  flex: 1; min-height: 3px; border-radius: 2px 2px 0 0;
  background: linear-gradient(to top, var(--blue), oklch(0.8 0.16 235 / 0.2));
  box-shadow: 0 0 8px oklch(0.6 0.2 255 / 0.3);
}
.chart-b:nth-child(even) {
  background: linear-gradient(to top, var(--cyan), oklch(0.86 0.12 220 / 0.2));
}
```

### 5.14 Activity Items

```css
.act-i {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 14px; border-radius: 10px;
  transition: background var(--ts);
}
.act-i:hover { background: rgba(120,160,255,0.05); }
.act-ic {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; border: 1px solid var(--line);
}
.act-t { font-size: 13px; font-weight: 600; color: var(--ink-0); }
.act-d { font-size: 11px; color: var(--ink-3); margin-top: 3px; }
.act-amt { font-family: 'JetBrains Mono'; font-size: 13px; font-weight: 600; color: var(--green); }
```

### 5.15 Notification Items

```css
.notif-i {
  display: flex; gap: 12px; padding: 12px 14px;
  border-radius: 10px; cursor: pointer;
  border: 1px solid transparent; transition: background var(--ts);
}
.notif-i:hover { background: rgba(120,160,255,0.04); }
.notif-i.unread {
  background: oklch(0.55 0.22 260 / 0.08);
  border-color: var(--line-3);
}
```

### 5.16 Chat Bubbles

- Avatar: 30px, JetBrains Mono
- Bubble: `bg: rgba(255,255,255,0.03)`, `border: 1px solid var(--line)`, `border-radius: 10px`, `padding: 9px 14px`, `max-width: 75%`
- Name: 11px, `var(--blue-2)`, weight 600
- Text: 12.5px, `var(--ink-1)`
- Timestamp: 9px, JetBrains Mono, `var(--ink-3)`

### 5.17 Calendar

```css
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
.cal-cell {
  aspect-ratio: 1; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; cursor: pointer;
  font-family: 'JetBrains Mono', monospace; border: 1px solid transparent;
}
.cal-cell:hover { background: rgba(120,160,255,0.1); }
.cal-cell.check { background: oklch(0.72 0.17 150 / 0.15); color: var(--green); border-color: oklch(... / 0.3); }
.cal-cell.today { border: 1px solid var(--blue-2); color: var(--blue-2); font-weight: 700; box-shadow: 0 0 10px oklch(...); }
.cal-cell.miss { background: var(--red-l); color: var(--red); border-color: oklch(... / 0.3); }
```

### 5.18 Trail Mode Indicators

| State | Style |
|-------|-------|
| Done (.trail-num.done) | `bg: oklch(0.72 0.17 150 / 0.2)`, `color: var(--green)`, `border: 2px solid oklch(... / 0.5)` |
| Current (.trail-num.curr) | `bg: oklch(0.55 0.22 260 / 0.25)`, `color: var(--blue-2)`, `border: 2px solid var(--line-3)`, `box-shadow: 0 0 12px oklch(...)` |
| Locked (.trail-num.lock) | `bg: rgba(255,255,255,0.03)`, `color: var(--ink-3)`, `border: 2px solid var(--line)` |
| Connector done | `background: linear-gradient(90deg, var(--green), var(--blue))` |

---

## 6. Page-Specific Patterns

### 6.1 Welcome Banner

```css
.welcome {
  position: relative; border-radius: 18px;
  padding: 30px 34px; color: #fff;
  overflow: hidden; margin-bottom: 24px;
  border: 1px solid var(--line-2);
  background: linear-gradient(140deg, #0a1230 0%, #050a1e 60%, #0a1a38 100%);
  min-height: 200px;
}
```

- Animated canvas stream background (optional)
- Center beam glow effect
- Pill badge with gradient icon
- H2: Instrument Serif, 38px, italic gradient text for emphasis
- Stats row: 4 columns, mono values, uppercase labels

### 6.2 Signal Cards (.sig-card)

```css
.sig-card {
  background: linear-gradient(180deg, rgba(14,20,44,0.6), rgba(8,12,28,0.6));
  border: 1px solid var(--line); border-radius: var(--radius);
  padding: 20px; transition: all var(--ts); cursor: pointer;
  backdrop-filter: blur(16px);
}
.sig-card:hover {
  border-color: var(--line-3); transform: translateY(-2px);
  box-shadow: 0 12px 30px -10px oklch(0.5 0.22 262 / 0.3);
}
```

### 6.3 Position Cards (.pos-card)

```css
.pos-card {
  background: linear-gradient(180deg, rgba(14,20,44,0.55), rgba(8,12,28,0.55));
  border: 1px solid var(--line); border-radius: var(--radius);
  padding: 18px; transition: all var(--ts); backdrop-filter: blur(14px);
}
.pos-card:hover { border-color: var(--line-3); }
```

Layout:
- Top row: Avatar (sm) + Provider name + strategy type + status badge
- Middle: 3-column grid (Invested, P/L, Win Rate) — mono uppercase labels
- Bottom: Follower count + action button

---

## 7. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| **≤ 768px** | Sidebar hidden off-screen (translateX(-100%)), main margin-left 0, grids collapse to 1 column, search hidden, content padding 16px |
| **≤ 1024px** | `.g4` → 2 columns, `.g3` → 2 columns, `.g5/.g6` → 3 columns |
| **> 1024px** | Full layout as described |

---

## 8. Animations & Transitions

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Default transition | `var(--ts)` = 0.28s | `cubic-bezier(0.4, 0, 0.2, 1)` | All hover/focus states |
| Page enter | 0.35s | `ease-out` | Route transitions |
| Modal enter | 0.25s | `ease-out` | Scale + translateY |
| Toast enter | 0.3s | `ease-out` | Slide from right |
| Progress bar | 1s | `ease-out` | Width transitions |

**Page enter keyframes:**
```css
@keyframes pgIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Modal enter keyframes:**
```css
@keyframes mIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
```

**Toast enter keyframes:**
```css
@keyframes tIn {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

---

## 9. Scrollbar Styling

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(120,160,255,0.18);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(120,160,255,0.3);
}
```

---

## 10. Background Effects (Optional)

For dark mode pages, apply subtle radial gradients:
```css
body {
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.3 0.15 260 / 0.35), transparent 60%),
    radial-gradient(ellipse 60% 40% at 90% 100%, oklch(0.3 0.18 280 / 0.2), transparent 55%);
}
```

---

## 11. Utility Classes

```css
.flex { display: flex; }
.aic  { align-items: center; }
.jcb  { justify-content: space-between; }
.gap2 { gap: 8px; }
.gap3 { gap: 12px; }
.gap4 { gap: 16px; }
.fw   { width: 100%; }

.mb1 { margin-bottom: 4px; }
.mb2 { margin-bottom: 8px; }
.mb3 { margin-bottom: 12px; }
.mb4 { margin-bottom: 16px; }
.mb6 { margin-bottom: 24px; }

.tg { color: var(--green); }   /* text green */
.tr { color: var(--red); }     /* text red */
.tb { color: var(--blue-2); }  /* text blue */
.tp { color: var(--purple); }  /* text purple */
.ty { color: var(--yellow); }  /* text yellow */
.t2 { color: var(--ink-2); }   /* text secondary */
.t3 { color: var(--ink-3); }   /* text muted */

.fb  { font-weight: 700; }
.f6  { font-weight: 600; }
.fs12 { font-size: 12px; }
.fs11 { font-size: 11px; }
.mono { font-family: 'JetBrains Mono', monospace; }
```

---

## 12. Tailwind Token Mapping

Since the frontend uses Tailwind CSS, map design tokens to Tailwind classes or arbitrary values.

### Colors

| Token | Tailwind Class (Dark) | Tailwind Class (Light) |
|-------|----------------------|------------------------|
| `--bg-0` | `bg-[#030611]` | `bg-[#f4f6fb]` |
| `--bg-1` | `bg-[#060a1a]` | `bg-white` |
| `--bg-2` | `bg-[#0b1228]` | `bg-[#eef2f9]` |
| `--bg-3` | `bg-[#0f1630]` | `bg-[#e4eaf4]` |
| `--ink-0` | `text-[#f5f7ff]` | `text-[#0b1228]` |
| `--ink-1` | `text-[#c9d1e8]` | `text-[#2a3654]` |
| `--ink-2` | `text-[#8892b0]` | `text-[#5c6784]` |
| `--ink-3` | `text-[#545d78]` | `text-[#8a93ab]` |
| `--line` | `border-white/8` | `border-[#0b1228]/8` |
| `--line-2` | `border-white/14` | `border-[#0b1228]/14` |
| `--line-3` | `border-[#78a0ff]/22` | `border-[#3c64dc]/30` |
| `--blue` | `text-[#4f8eff]` | `text-[#3a7ae8]` |
| `--blue-2` | `text-[#7aadff]` | `text-[#5a9af5]` |
| `--green` | `text-[#3ddc84]` | `text-[#2cb86a]` |
| `--red` | `text-[#ff5555]` | `text-[#e04545]` |
| `--yellow` | `text-[#ffd166]` | `text-[#e5b84d]` |
| `--purple` | `text-[#c77dff]` | `text-[#a85ee0]` |
| `--cyan` | `text-[#7ee8ff]` | `text-[#5acce5]` |
| `--orange` | `text-[#ff9f4d]` | `text-[#e0853a]` |

### Typography

| Role | Tailwind Class |
|------|---------------|
| Hero Display | `font-serif text-[clamp(38px,5vw,92px)] font-normal leading-[0.98] tracking-[-0.02em]` |
| Section Title | `font-serif text-[26px] md:text-[32px] font-normal leading-[1.05] tracking-[-0.01em]` |
| Card Title | `font-serif text-[20px] font-normal leading-[1.1] tracking-[-0.01em]` |
| Mono Stat | `font-serif text-[34px] font-normal leading-none tracking-[-0.02em]` |
| Body | `font-sans text-[13px] md:text-sm font-normal leading-[1.5]` |
| Label | `font-mono text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.08em]` |
| Micro | `font-sans text-[9px] md:text-[10px] font-medium tracking-[0.05em]` |

### Spacing

| Token | Tailwind |
|-------|----------|
| Card padding | `p-5` (20px) |
| Card radius | `rounded-[14px]` |
| Button radius | `rounded-[9px]` |
| Badge radius | `rounded-md` (6px) |
| Input radius | `rounded-[9px]` |
| Content gap | `gap-4` (16px) |
| Content padding | `px-6 py-6 pb-[60px]` |
| Mobile padding | `p-4` (16px) |

---

## 13. Design Decision Framework

When designing something not explicitly covered in this doc, follow this hierarchy:

1. **Copy an existing pattern.** Look at §5 (Components) or §6 (Page Patterns). If something close exists, adapt it.
2. **Follow the hierarchy:** Background → Border → Text → Accent.
   - Start with `--bg-0` or `--bg-2` for surfaces.
   - Use `var(--line)` for borders.
   - Use `--ink-1` for body text.
   - Use semantic colors ONLY for meaning (green=profit, red=loss, etc.).
3. **Typography hierarchy:**
   - Is it a headline? → Instrument Serif
   - Is it a number/price/time? → JetBrains Mono
   - Everything else → Inter
4. **Spacing hierarchy:**
   - Related items → `gap-2` (8px)
   - Card internals → `gap-3` (12px)
   - Between cards → `gap-4` (16px)
   - Sections → `mb-6` (24px)
5. **Interaction:**
   - Hover = `brightness(1.1)` or border color shift to `--line-2`
   - Focus = `box-shadow: 0 0 0 3px oklch(0.55 0.22 260 / 0.15)`
   - Active/selected = gradient bg + `--line-3` border
6. **Still unsure?** Default to the card base style (§5.3) and adjust from there.

---

## 14. Component Selection Guide

Use this decision tree to pick the right component:

| I need to show... | Use... | Section |
|-------------------|--------|---------|
| A grouped set of related info | `.card` | §5.3 |
| A number with a label and trend | `.stat-card` | §5.3 |
| A clickable item in a list | `.sig-card` or `.pos-card` | §6.2, §6.3 |
| A primary action | `.btn-blue` | §5.4 |
| A destructive action | `.btn-red` | §5.4 |
| A secondary action | `.btn-ghost` or `.btn-outline` | §5.4 |
| A status/tag | `.badge` + color class | §5.5 |
| Tabular data | `.tbl` | §5.6 |
| A text field | `.fi` | §5.7 |
| A boolean switch | `.tog-sw` | §5.7 |
| Segmented options | `.tabs` | §5.8 |
| A user avatar | `.av` / `.av-sm` / `.av-lg` | §5.9 |
| A progress/completion indicator | `.prog` | §5.10 |
| A temporary alert | `.toast` | §5.11 |
| A dialog overlay | `.modal` | §5.12 |
| A mini chart/sparkline | `.chart-ph` | §5.13 |
| A feed item | `.act-i` | §5.14 |
| A notification row | `.notif-i` | §5.15 |
| A chat message | Chat bubble | §5.16 |
| A date picker grid | `.cal-grid` | §5.17 |
| A multi-step progress | `.trail-num` | §5.18 |

---

## 15. State Patterns

Every async UI element MUST handle four states:

### 15.1 Loading

```tsx
// Skeleton loader for cards
<div className="animate-pulse">
  <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
  <div className="h-8 bg-white/5 rounded w-2/3 mb-4" />
  <div className="h-20 bg-white/5 rounded" />
</div>
```

Rules:
- Use `bg-white/5` on dark, `bg-black/5` on light.
- Always preserve the layout structure (same heights/gaps as real content).
- Never use a generic spinner when skeletons are possible.
- Spinner (last resort): `animate-spin rounded-full h-5 w-5 border-2 border-[#4f8eff] border-t-transparent`

### 15.2 Empty

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
    <Icon className="w-5 h-5 text-[#545d78]" />
  </div>
  <h3 className="font-serif text-[18px] text-[#f5f7ff] mb-1">No items yet</h3>
  <p className="text-[13px] text-[#8892b0] max-w-[280px]">
    Description of what would appear here and how to add it.
  </p>
  <!-- Optional CTA -->
  <button className="btn-blue mt-4">Add First Item</button>
</div>
```

### 15.3 Error

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-12 h-12 rounded-full bg-[#ff5555]/10 flex items-center justify-center mb-4">
    <AlertTriangle className="w-5 h-5 text-[#ff5555]" />
  </div>
  <h3 className="font-serif text-[18px] text-[#f5f7ff] mb-1">Something went wrong</h3>
  <p className="text-[13px] text-[#8892b0] max-w-[320px] mb-4">
    {error.message || "We couldn't load this data. Please try again."}
  </p>
  <button className="btn-outline" onClick={retry}>Retry</button>
</div>
```

### 15.4 Success / Populated

Normal component rendering. Ensure data is formatted per §3.3 (JetBrains Mono for numbers, etc.).

---

## 16. Form Validation Patterns

### Inline Error

```tsx
<div className="mb-4">
  <label className="fl">Risk Capital</label>
  <input
    className="fi border-[#ff5555]/50 focus:border-[#ff5555] focus:shadow-[0_0_0_3px_rgba(255,85,85,0.15)]"
    ...
  />
  <p className="mt-1.5 text-[11px] text-[#ff5555] font-mono">
    Minimum risk capital is $100.00
  </p>
</div>
```

Rules:
- Error border: `border-[#ff5555]/50`
- Error focus ring: `shadow-[0_0_0_3px_rgba(255,85,85,0.15)]`
- Error text: JetBrains Mono, 11px, `--red`
- Show inline, immediately below the field.
- Never use browser-native validation UI (disable `noValidate` on forms).

### Field Success

```tsx
<input className="fi border-[#3ddc84]/40 focus:border-[#3ddc84]" ... />
```

### Disabled Field

```tsx
<input
  disabled
  className="fi opacity-50 cursor-not-allowed bg-white/[0.02]"
  ...
/>
```

---

## 17. Iconography Rules

| Icon Set | When to Use | Examples |
|----------|-------------|----------|
| **Lucide React** | Default for all UI icons | Navigation, buttons, form fields, actions |
| **Font Awesome** (if loaded) | Social/brand icons only | Discord, Twitter, Telegram, broker logos |
| **Custom SVG** | Logo, app-specific symbols | Tradeverse logo, strategy type badges |

Rules:
- Default icon size: `16px` (w-4 h-4) in buttons, `18px` (w-[18px] h-[18px]) in nav, `20px` in empty states.
- Icon color matches text color of its container.
- Button icons: `gap-[7px]` between icon and text.
- Nav icons: `mr-3` (12px) between icon and label.
- NEVER use emojis as icons. Always use Lucide or custom SVG.

---

## 18. z-index Scale

| Layer | z-index | Usage |
|-------|---------|-------|
| Content | 1-10 | Normal page elements, sticky headers |
| Dropdowns | 50 | Select menus, autocomplete lists |
| Sidebar | 100 | Fixed sidebar |
| Topbar | 100 | Fixed topbar (same plane as sidebar) |
| Drawers | 200 | Mobile nav drawer |
| Modal overlay | 500 | Modal backdrop |
| Modal content | 510 | Modal card |
| Toasts | 1000 | Toast notifications |
| Tooltips | 1100 | Hover tooltips |
| Loading overlay | 2000 | Full-page loading states |

---

## 19. Page Composition Guide

Every new page MUST follow this structure:

```tsx
<div className="min-h-screen bg-[#030611] text-[#f5f7ff]">
  {/* Optional background effects */}
  <Sidebar />
  
  <div className="ml-[240px] min-h-screen">
    <Topbar title="Page Title" breadcrumb={['Parent', 'Current']} />
    
    <main className="px-6 py-6 pb-[60px] animate-[pgIn_0.35s_ease-out]">
      {/* Welcome banner (optional) */}
      <WelcomeBanner />
      
      {/* Stats row (optional) */}
      <div className="g4 mb-6">
        <StatCard label="Portfolio" value="$0.00" />
        ...
      </div>
      
      {/* Content tabs (optional) */}
      <Tabs />
      
      {/* Main content */}
      <Card>...data tables, forms, etc...</Card>
    </main>
  </div>
</div>
```

Rules:
- Always wrap in `bg-[#030611]` (dark) or `bg-[#f4f6fb]` (light).
- Always use `text-[#f5f7ff]` (dark) or `text-[#0b1228]` (light) as default text.
- Page content gets `animate-[pgIn_0.35s_ease-out]` (§8).
- Cards group related content. Don't put loose elements on the page background.
- Max content width: none (full width), but inner grids should use `.g2`–`.g6`.

---

## 20. Do's and Don'ts

### Colors
| ✅ DO | ❌ DON'T |
|-------|----------|
| Use `var(--green)` for profit, `var(--red)` for loss | Use green for warnings or red for success |
| Use `--ink-2` for placeholder/muted text | Use `--ink-0` for secondary text |
| Use `--line` for default borders | Use arbitrary gray hex codes |
| Apply OKLCH glows sparingly (active states only) | Apply glows to everything |

### Typography
| ✅ DO | ❌ DON'T |
|-------|----------|
| Use JetBrains Mono for ALL numbers/prices | Use Inter for dollar amounts |
| Uppercase + letter-space labels | Use sentence case for form labels |
| Use Instrument Serif for page titles | Use Inter bold for page titles |

### Components
| ✅ DO | ❌ DON'T |
|-------|----------|
| Use `.btn-ghost` for secondary/cancel actions | Use `.btn-blue` for everything |
| Show skeletons while data loads | Show "Loading..." text |
| Use badges for status, tags for categories | Use badges for primary actions |
| Keep modals under 460px wide | Make modals full-width on desktop |

### Layout
| ✅ DO | ❌ DON'T |
|-------|----------|
| Use consistent 16px gap between cards | Use random gaps (12px, 14px, 18px) |
| Collapse to 1 column on mobile | Squash 4 columns into tiny mobile columns |
| Keep sidebar fixed on desktop | Let sidebar scroll with content |

---

## 21. Accessibility Rules

Minimum requirements for every component:
- **Color contrast:** All text on backgrounds must be ≥ 4.5:1. `--ink-1` on `--bg-2` passes. `--ink-3` on `--bg-0` does NOT — use `--ink-3` only for decorative/non-essential text.
- **Focus indicators:** Every interactive element MUST have a visible focus state. Use the focus ring spec from §5.7 (Forms).
- **Semantic HTML:** Use `<button>` for actions, `<a>` for navigation, `<label>` with `for` for inputs.
- **Modal traps:** When a modal opens, focus moves to the first focusable element inside. Escape key closes the modal. Return focus to trigger on close.
- **Toast announcements:** Use `aria-live="polite"` region for toast container so screen readers announce them.
- **Icons with meaning:** Any icon that conveys meaning (not purely decorative) needs `aria-label` or visually hidden text.

---

## 22. Dark / Light Mode Implementation

The system supports both modes via a `dark` class on `<html>` or `<body>`.

### Toggle Strategy
- Store preference in `localStorage` key: `theme` (`'dark'` | `'light'`).
- Default: **dark**.
- On load: if `localStorage.theme === 'light'`, remove `dark` class. Otherwise, add it.
- Toggle button: moon icon (switch to light) / sun icon (switch to dark).

### Tailwind Implementation
```tsx
// tailwind.config.ts
export default {
  darkMode: 'class',
  // ...
}

// In component
<div className="bg-[#f4f6fb] dark:bg-[#030611] text-[#0b1228] dark:text-[#f5f7ff]">
```

### CSS Variable Approach (Alternative)
```css
:root {
  --bg-0: #f4f6fb;
  --ink-0: #0b1228;
  /* ...light values */
}
.dark {
  --bg-0: #030611;
  --ink-0: #f5f7ff;
  /* ...dark values */
}
```

**Rule:** Every color token MUST have both dark and light definitions. Never hardcode a light-only color without a dark counterpart.

---

## 23. Completion Checklist

Before marking any UI task as done, verify:

- [ ] All colors use tokens from §2 (no arbitrary hex codes).
- [ ] All text uses correct font family from §3 (Inter / Instrument Serif / JetBrains Mono).
- [ ] All spacing uses tokens from §4 (no magic numbers like 13px, 19px).
- [ ] All interactive elements have hover and focus states.
- [ ] Loading, empty, and error states are handled (§15).
- [ ] Form validation follows §16.
- [ ] Icons follow §17 (Lucide, correct sizes).
- [ ] z-index follows §18 scale.
- [ ] Page follows §19 composition structure.
- [ ] No accessibility violations (§21).
- [ ] Dark/light mode classes applied (§22).
- [ ] Build passes (`npm run build` in `app/`) with zero errors.

---

## 24. Reference Files

| File | What It Contains |
|------|-----------------|
| `design/Tv 2.0/Tradeverse Dashboard.html` | Dark mode — full dashboard with all components |
| `design/Tv 2.0/Tradeverse Dashboard Light.html` | Light mode — same structure, light palette |
| `design/clientdashboard.html` | Older light variant (Inter only) |
| `design/admindashboard.html` | Admin panel (Geist, white bg) — separate system |

---

*Every agent MUST reference this file before writing any UI code. This is the single source of truth. If a pattern is not explicitly covered here, use the Design Decision Framework (§13) to derive it. Never invent arbitrary colors, fonts, spacing, or animations.*
