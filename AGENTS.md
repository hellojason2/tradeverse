# AGENTS.md — Tradeverse 2.0

## Project Overview

Tradeverse 2.0 is a web-based trading and copy-trading platform built with React, TypeScript, and Vite. This document provides build rules and conventions for AI coding agents.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS (to be installed) |
| UI Components | shadcn/ui (to be installed) |
| State Management | Zustand (to be installed) |
| Routing | React Router v7 (to be installed) |
| Icons | Lucide React (to be installed) |
| Fonts | Geist + Geist Mono (from design.md) |

## Project Structure

```
TV 2.0/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   └── common/      # Shared components
│   ├── pages/           # Route-level page components
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand state stores
│   ├── lib/             # Utility functions
│   ├── types/           # TypeScript types/interfaces
│   ├── styles/          # Global styles, Tailwind config
│   └── assets/          # Images, fonts, icons
├── design.md            # Visual design system reference (DO NOT EDIT)
├── .agents/skills/      # Anti-gravity Awesome Skills
└── AGENTS.md            # This file
```

## Design System Rules

- **ALWAYS** reference `design.md` in the project root for all visual decisions
- Use the Vercel-inspired design system: black/white precision, Geist font
- Primary colors: #171717 (black), #ffffff (white)
- Accent colors: #0a72ef (blue), #de1d8d (pink), #ff5b4f (red)
- Typography: Geist for sans-serif, Geist Mono for monospace
- Spacing scale: 2px, 4px, 6px, 8px, 12px, 16px, 32px, 40px
- Border radius: 2px (code), 6px (buttons), 8px (cards), 9999px (badges)
- Shadows follow the elevation system defined in design.md

## Coding Conventions

### TypeScript
- Use strict TypeScript with explicit types
- Prefer interfaces over types for object shapes
- Use `type` for unions, intersections, and utility types
- Avoid `any`; use `unknown` when type is uncertain

### React
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused (single responsibility)
- Use custom hooks for reusable logic
- Implement proper loading and error states

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use CSS variables for theme values (defined in design.md)
- Keep inline styles to a minimum

### File Naming
- Components: PascalCase (e.g., `LoginForm.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase with descriptive names (e.g., `UserProfile.ts`)

## State Management

- Use Zustand for global state
- Keep state as close to where it's used as possible
- Use React Query (TanStack Query) for server state
- Implement proper caching and invalidation

## API Integration

- Use a centralized API client
- Handle errors gracefully with user-friendly messages
- Implement request/response interceptors for auth tokens
- Use environment variables for API base URLs

## Authentication

- JWT token stored in `localStorage`
- Implement token refresh mechanism
- Protect routes with auth guards
- Support OAuth (Google, Apple, Telegram)

## Performance

- Use React.lazy for code splitting
- Implement proper loading skeletons
- Optimize images and assets
- Use memoization where appropriate (React.memo, useMemo, useCallback)

## Interaction Patterns

See [BEHAVIOR.md](./BEHAVIOR.md) for the complete interaction authority. Every page must pass the agent checklist at the bottom of BEHAVIOR.md before declaring done. New external-reference types register in `src/lib/externalLinks.ts` — never hardcode external URLs in components.

## Accessibility

- Follow WCAG 2.1 AA standards
- Use semantic HTML elements
- Implement proper ARIA labels
- Ensure keyboard navigation works
- Maintain color contrast ratios

## Git Conventions

- Use conventional commits
- Keep commits atomic and focused
- Write descriptive commit messages
- Create feature branches for new work

## Build Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Key Dependencies to Install

```bash
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom
npm install zustand
npm install @tanstack/react-query
npm install lucide-react
npm install clsx tailwind-merge
npm install class-variance-authority
```

## Important Notes

- **agents.md** dictates HOW the project should be built (this file)
- **design.md** dictates HOW it should look and feel (visual reference)
- NEVER mix these concerns into a single prompt
- Always verify skills are available in `.agents/skills/` before referencing them
- Use `@skill-name` syntax to reference specific skills when prompting
