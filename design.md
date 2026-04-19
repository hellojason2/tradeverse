# Design System Inspired by Vercel

## Overview

Frontend deployment. Black and white precision, Geist font.

Vercel takes frontend deployment as its base, then sharpens it through black and white precision, Geist font. It is a strong fit for developer platforms, monochrome precision designs, and infrastructure marketing.

---

## Colors

### Primary

| Name | Hex | Role |
|------|-----|------|
| Vercel Black | #171717 | Primary text, headings |
| Pure White | #ffffff | Page background |
| True Black | #000000 | Console text default |

### Workflow Accents

| Name | Hex | Role |
|------|-----|------|
| Develop Blue | #0a72ef | Development workflow |
| Preview Pink | #de1d8d | Preview deployments |
| Ship Red | #ff5b4f | Ship to production |

### Console Colors

| Name | Hex | Role |
|------|-----|------|
| Console Blue | #0070f3 | Syntax blue |
| Console Purple | #7928ca | Syntax purple |
| Console Pink | #eb367f | Syntax pink |

### Neutral Scale

| Name | Hex | Role |
|------|-----|------|
| Gray 600 | #4d4d4d | Secondary text |
| Gray 500 | #666666 | Tertiary text |
| Gray 400 | #808080 | Placeholders |
| Gray 100 | #ebebeb | Borders, dividers |
| Gray 50 | #fafafa | Subtle surface tint |

### Interactive

| Name | Hex | Role |
|------|-----|------|
| Link Blue | #0072f5 | Links |
| Focus Blue | hsl(212,100%,48%) | Focus ring |
| Badge Bg | #ebf5ff | Pill badge surface |
| Badge Text | #0068d6 | Pill badge text |

---

## Typography

### Font Families

| Role | Font |
|------|------|
| Sans | Geist, system-ui, -apple-system, Arial, sans-serif |
| Mono | Geist Mono, ui-monospace, SFMono-Regular, 'Roboto Mono', Menlo, monospace |

### Scale

| Name | Size | Weight | Line Height | Letter Spacing | Font |
|------|------|--------|-------------|----------------|------|
| Display Hero | 48px | 600 | 1.00 | -2.4px | Geist |
| Section Heading | 40px | 600 | 1.20 | -2.4px | Geist |
| Sub-heading Large | 32px | 600 | 1.25 | -1.28px | Geist |
| Card Title | 24px | 600 | 1.33 | -0.96px | Geist |
| Card Title Light | 24px | 500 | 1.33 | -0.96px | Geist |
| Body Large | 20px | 400 | 1.80 | normal | Geist |
| Body Medium | 16px | 500 | 1.50 | normal | Geist |
| Body Semibold | 16px | 600 | 1.50 | -0.32px | Geist |
| Button / Link | 14px | 500 | 1.43 | normal | Geist |
| Caption | 12px | 500 | 1.33 | normal | Geist |
| Mono Body | 16px | 400 | 1.50 | normal | Geist Mono |
| Mono Label | 12px | 500 | 1.00 | uppercase | Geist Mono |
| Micro Badge | 7px | 700 | 1.00 | uppercase | Geist |

---

## Spacing

| Token | Value |
|-------|-------|
| xs | 2px |
| sm | 4px |
| md | 6px |
| lg | 8px |
| xl | 12px |
| 2xl | 16px |
| 3xl | 32px |
| 4xl | 40px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| code | 2px | Code spans |
| small | 4px | Small elements |
| button | 6px | Buttons |
| card | 8px | Cards |
| image | 12px | Images |
| tab | 64px | Tabs |
| pill | 9999px | Badges |

---

## Shadows / Elevation

| Level | Value | Description |
|-------|-------|-------------|
| 0: Flat | none | No shadow |
| 1: Ring | rgba(0,0,0,0.08) 0px 0px 0px 1px | Shadow-as-border |
| 1b: Light Ring | rgb(235,235,235) 0px 0px 0px 1px | Lighter ring |
| 2: Card | ring + rgba(0,0,0,0.04) 0px 2px 2px 0px + rgb(250,250,250) 0px 0px 0px 1px | Ring + subtle lift |
| 3: Full Card | ring + lift + rgba(0,0,0,0.04) 0px 8px 8px -8px + glow | Ring + lift + ambient + glow |
| Focus | 0 0 0 2px hsl(212,100%,48%) | Accessibility ring |

---

## Components

### Navigation

- Sticky top, z-index 100
- Background: rgba(255,255,255,0.85) with backdrop-filter: blur(12px)
- Box shadow: var(--shadow-ring)
- Padding: 12px 32px
- Layout: flex, space-between
- Brand: 14px, weight 600, letter-spacing -0.28px
- Links: 14px, weight 500, color Gray 600, hover to Black
- CTA: Black bg, White text, 8px 16px padding, 6px radius

### Hero

- Padding: 96px 32px 80px
- Text align: center
- H1: 48px, weight 600, line-height 1.00, letter-spacing -2.4px
- Subtitle: 20px, weight 400, line-height 1.80, color Gray 600, max-width 600px
- Buttons: flex, gap 12px, centered

### Buttons

**Primary Dark**
- Background: var(--black) (#171717)
- Color: var(--white)
- Padding: 10px 20px
- Border radius: 6px
- Font: 14px, weight 500
- Hover: opacity 0.85

**Ghost / Shadow**
- Background: var(--white)
- Color: var(--black)
- Padding: 10px 20px
- Border radius: 6px
- Box shadow: var(--shadow-ring-light)
- Hover: box-shadow: var(--shadow-ring)

**Pill Badge**
- Background: var(--badge-bg) (#ebf5ff)
- Color: var(--badge-text) (#0068d6)
- Padding: 4px 10px
- Border radius: 9999px
- Font: 12px, weight 500

**Workflow Pills**
- Develop: bg #0a72ef, color white
- Preview: bg #de1d8d, color white
- Ship: bg #ff5b4f, color white

### Cards

- Background: white
- Border radius: 8px
- Padding: 24px
- Box shadow: var(--shadow-card)
- Hover: box-shadow: var(--shadow-card-full)
- Transition: box-shadow 0.2s
- Title: 20px, weight 600, letter-spacing -0.8px
- Body: 14px, color Gray 600, line-height 1.50
- Badge: inline, mono 12px, uppercase, 2px 8px padding, 9999px radius

### Forms

**Input**
- Width: 100%
- Background: white
- Border: none
- Padding: 10px 12px
- Border radius: 6px
- Font: 14px
- Box shadow: var(--shadow-ring)
- Focus: box-shadow 0 0 0 2px var(--focus-blue)
- Error: box-shadow 0 0 0 2px var(--ship-red)

**Textarea**
- Same as input
- min-height: 80px
- resize: vertical

**Label**
- Display: block
- Font: 14px, weight 500
- Color: Black
- Margin bottom: 6px

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Mobile (< 768px) | Hero H1: 36px, letter-spacing -1.8px; Nav links hidden; Section padding: 48px 20px; Cards: single column |
| Desktop (>= 768px) | Full layout as described |

---

## Usage

```bash
npx getdesign@latest add vercel
```

Run this command from your project root, then ask your AI assistant to use DESIGN.md for UI work.

---

*Not an official Vercel design system. A curated starting point for building vercel-like UIs with your AI coding agent.*
