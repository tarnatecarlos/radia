# Radia Design System

A clean, modern design system for **Radia** — a unified HR management workspace. This system was derived from the Radia product codebase (`radia/`, a Next.js 16 + React 19 + Tailwind v4 + shadcn app) and **redesigned toward a cleaner, flatter, light-first aesthetic** at the user's request — with special attention to the org chart. The heavy glassmorphism, floating gradient orbs, and rainbow-gradient avatars of the original build have been retired in favor of crisp surfaces, restrained indigo accents, and clear hierarchy.

---

## What is Radia?

Radia is a **modern HR management platform** ("Radia Workspace" / "HR Workspace"). It gives a company one place to run people operations. Core product areas:

| Area | What it does |
|---|---|
| **Dashboard** | At-a-glance home: headcount, active tasks, onboarding progress, SOP count, recent activity, quick actions. |
| **Tasks** | A task manager with Kanban / List / Table views, priorities, assignees, and tasks auto-created from integration webhooks (Slack, GitHub, Discord). |
| **Org Chart** | Interactive, pannable/zoomable org tree (top-down, left-right, radial layouts) showing reporting lines, roles, and onboarding status. **Primary redesign focus.** |
| **Onboarding** | Course + lesson based new-hire onboarding with per-employee enrollment progress. |
| **SOPs** | Versioned standard-operating-procedure / knowledge base (Markdown content, categories, version history). |
| **Integrations** | Webhook connections to Slack, GitHub, Gmail, Discord, Teams, Messenger — surface live status and pipe events into tasks. |
| **Settings** | Workspace + personal preferences, theme toggle. |
| **Admin** | Server-level administration (separate from the workspace): access requests, server admins, workspace overview, system health, audit log. |

### Three role pipelines (three UX surfaces)

Radia separates **workspace roles** from **server roles**. This produces three distinct UX/UI pipelines, each with its own UI kit in `ui_kits/`:

1. **User** (`user`) — a regular employee. Consumes the workspace: their dashboard, assigned tasks, the org chart, their onboarding courses, and SOPs. Read-mostly, focused, calm.
2. **Workspace / "surface" admin** (`creator`, `moderator`) — runs a workspace. Manages members, authors SOPs & courses, assigns onboarding, creates tasks, configures integrations. Full create/edit affordances.
3. **Application / server admin** (`super_admin`, `devops`, `auditor`) — operates the Radia platform itself across workspaces. Reviews server-access requests, monitors system health, reads the audit log, can pause/delete workspaces. A deliberately more serious, "operations console" treatment with caution cues (red/amber) for destructive power.

---

## Sources

These were the inputs used to build this system. The reader may not have access; they are recorded for provenance.

- **Codebase:** `radia/` — local Next.js app (App Router). Mounted read-only via File System Access API.
  - Design tokens: `radia/src/app/globals.css` (Tailwind v4 `@theme`, shadcn variables, glassmorphism CSS — largely superseded here).
  - Fonts: `radia/src/app/layout.tsx` → **Geist** + **Geist Mono** via `next/font/google`.
  - Icons: `lucide-react` (`radia/package.json`), e.g. `radia/src/components/layout/sidebar.tsx`.
  - Data model: `radia/src/lib/types.ts`, mock content & copy: `radia/src/lib/mock-data.ts`.
  - Screens: `radia/src/components/{dashboard,tasks,org-chart,onboarding,sops,integrations,admin,settings}/*-content.tsx`.
- No external Figma file or slide deck was provided.
- No proprietary brand logo asset exists in the repo (only Next.js starter SVGs in `radia/public/`). The Radia mark is a **wordmark** — see `assets/`.

---

## Content fundamentals

How Radia writes. Pulled from real product copy in `mock-data.ts`, component headings, and microcopy.

- **Voice:** Calm, competent, direct. It reads like a well-run ops team, not a hype brand. No exclamation marks in UI chrome, no jokes, no emoji.
- **Person:** Second person for the user ("Welcome back, Alex", "your team lead", "your local timezone"). First-person-plural for company/policy voice in SOPs and courses ("We build tools that help teams thrive", "We operate on a flexible schedule").
- **Casing:** **Title Case** for navigation, page titles, buttons, and section headers ("Create Task", "Recent Activity", "Server Administration", "Access Requests"). **Sentence case** for body copy, descriptions, helper text, and table cells.
- **Headings are nouns or noun phrases:** "Organization Chart", "Onboarding Overview", "System Health", "Workspace Overview". Greetings are the one exception ("Welcome back, {name}").
- **Buttons are imperative verb phrases:** "Create Task", "Add Employee", "New SOP", "Approve", "Reject", "Reset Positions", "Fit to screen".
- **Status & enums are SHORT and consistent:** task statuses render as "To Do / In Progress / Review / Done"; priorities "High / Medium / Low"; roles "Creator / Moderator / User / Super Admin / DevOps / Auditor". Stored as UPPER_SNAKE (`IN_PROGRESS`) but always displayed humanized.
- **Numbers + units are terse:** "24ms latency", "120 req/min", "45.2 GB / 100 GB", "99.97%", "10 employees", "3 pending". Mono/tabular figures for anything numeric.
- **Time is relative in feeds, absolute in records:** "Today", "Yesterday", "3 days ago", "2 weeks ago" in activity; "Jul 18, 2024" in tables and audit logs.
- **Helper/hint text is lowercase-leaning and instructional:** e.g. the org-chart hint "Scroll to zoom · Space+drag or middle-click to pan · Drag nodes to reposition" (middots as separators).
- **Vibe:** Trustworthy software for HR/ops people. Professional but not stiff; modern SaaS, not enterprise-gray. No marketing fluff inside the app.

**Do:** "Onboarding Progress · 68%" · "5 SOPs Published" · "Submit requests at least 2 weeks in advance."
**Don't:** "🎉 Woohoo, you're all caught up!!!" · "Let's gooo" · emoji in nav or buttons.

---

## Visual foundations

The redesigned Radia look. Where the original differed, that's noted.

### Color
- **Brand = Indigo.** `--radia-indigo-600 (#4f46e5)` is the single accent, used for primary buttons, active nav, focus rings, links, progress fills, and selected states. The original indigo→violet **gradient** treatments (logo text, buttons, avatars, connector lines) are **retired** — indigo is now used flat and sparingly so it stays meaningful.
- **Neutrals = Slate.** App canvas is `slate-50`, surfaces are pure white, text steps through `slate-900 → 600 → 400`, borders are `slate-200`. This carries ~90% of every screen; color is the exception, not the rule.
- **Status palette:** emerald (success/healthy/done), amber (warning/pending/in-review), rose (danger/destructive/rejected), sky (info), teal & violet (role accents). Always used as a **soft tint background + saturated foreground** pair (e.g. `--success-soft` bg + `--success` text) for badges/pills.
- **Role colors** are fixed: Creator=violet, Moderator=sky, User=slate, Super Admin=rose, DevOps=amber, Auditor=teal.
- **Imagery/avatars:** people are shown as **solid-color initial avatars** (one deterministic color per person from the slate/indigo/emerald/amber/rose/sky/teal/violet set) — not rainbow gradients. Calm, single-hue.

### Type
- **Geist Sans** for everything UI; **Geist Mono** for numerics, code, IDs, latency/percent figures (tabular). Geist is geometric-humanist, neutral, very legible at small sizes — ideal for dense product tables.
- Page titles `--text-2xl` (28px) bold with tight tracking. Panel headings `--text-xl/lg` semibold. Body `--text-sm` (14px) — the product default. Meta `--text-xs` (12px). Eyebrows are 12px uppercase semibold with `+0.04em` tracking (used for nav group labels like "MENU", "MESSAGES", and table headers).
- Headings get **negative letter-spacing** (`-0.02em`); uppercase eyebrows get **positive** tracking.

### Spacing & layout
- **4px grid.** Common steps 4 / 8 / 12 / 16 / 24 / 32.
- App shell: fixed **left sidebar** (~240px: wordmark, MENU nav group, MESSAGES/integration-status group, settings + theme toggle + user chip pinned bottom) and a scrolling content area with `24–32px` padding (`p-6 lg:p-8`).
- Content max-widths are generous; cards sit in responsive grids (`grid-cols-1 sm:2 lg:4` for stat rows, `lg:3` for dashboard split).
- Tables for dense admin data; cards for scannable dashboards; a free-form pannable canvas for the org chart.

### Surfaces, borders, corners, elevation
- **Cards:** white surface, `1px` `slate-200` border, `--radius-lg` (10px) corners, `--shadow-sm`. On hover, lift to `--shadow-md` (no scale jump in the redesign — the original's `scale(1.02)` elastic spring is dialed back to a calm shadow/translate). Generous internal padding (16–24px).
- **Radii:** 10px is the workhorse (cards, inputs, buttons). 6–8px for small chips/menu items, `--radius-full` for pills, avatars, status dots, toggles.
- **Elevation is shadow-based, not blur-based.** Glassmorphism (`backdrop-filter: blur`, translucent fills) is removed from the core system. Overlays (menus, dialogs, tooltips) use solid white surfaces + `--shadow-lg` + a hairline border.
- **Borders** are the primary separator. Hairline `slate-200` everywhere; `slate-300` when a stronger edge is needed.

### Backgrounds & texture
- Mostly flat `slate-50` canvas. **One** allowed texture: a subtle **dot grid** on the org-chart canvas (`radial-gradient(circle, slate-300 1px, transparent 1px)`, 24px), which scales with zoom. No photographic backgrounds, no full-bleed imagery, no mesh gradients, no noise/grain.

### Motion
- **Purposeful and quick.** Enter animations: short fade + 12–20px upward slide, `~0.3–0.5s`, easing `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out), with small stagger (`0.04–0.1s` per item) for lists/grids.
- Org-chart node repositioning uses a **spring** (`stiffness ~120, damping ~20`); connector lines draw in via `pathLength`. Drag is 1:1 with no easing.
- Hover/press feedback is `150–200ms`. The old bouncy `scale(1.02)` card hover is replaced by a calm shadow raise. Respect `prefers-reduced-motion`.

### Interaction states
- **Hover:** surfaces tint to `--surface-2`/`slate-50` or lift one shadow step; primary buttons darken to `--accent-hover`; nav items get a `slate-100` fill.
- **Active/selected nav:** `--accent-soft` (indigo-50) fill + indigo text + a `3px` indigo left accent bar (`rounded-r-full`).
- **Press:** subtle `scale(0.98)` on buttons (the one place a tiny scale remains). 
- **Focus:** `--shadow-focus` 3px indigo ring at 18% — always visible for keyboard users.
- **Disabled:** 40% opacity, no pointer.
- **Drag (kanban/org):** lifted shadow, target column tints indigo-50 with indigo border.

### Transparency / blur
- Used sparingly: tooltip/menu scrims and the destructive-admin caution chips may use soft tints, but **not** frosted glass. Status soft-bg pills use ~`-50` tints (effectively a flat light color, not alpha-over-photo).

---

## Iconography

- **Library: [Lucide](https://lucide.dev)** — the product uses `lucide-react`. Lucide is a clean, consistent **outline** set: `~1.5–2px` stroke, rounded line caps/joins, 24×24 grid. This is the canonical Radia icon language; do not mix in filled/duotone sets.
- **In these artifacts** Lucide is loaded from CDN (`https://unpkg.com/lucide@latest`) since the repo's icons are React components. Size icons at **16–20px** in UI (nav `18px`, inline `14–16px`), color them `currentColor` so they inherit text color (`--fg-2`/`--fg-3` normally, `--accent` when active).
- **Common icons seen in product:** `LayoutDashboard, CheckSquare, Network, GraduationCap, BookOpen, Plug, Settings, Shield, Users, UserPlus, FileText, Clock, Activity, Database, HardDrive, AlertTriangle, Building, ZoomIn, ZoomOut, Maximize, RotateCcw, ArrowRight, ArrowDown, Plus, GripVertical, Sun, Moon`.
- **Integration brand glyphs:** Slack/GitHub/Gmail/Discord/Teams/Messenger are referenced by name and a brand-color status dot. Use the real brand SVGs (e.g. from Simple Icons) for integration tiles; never approximate them with Lucide.
- **No emoji** anywhere in product UI. **No Unicode pictographs** as icons. The only non-alphanumeric glyph used in copy is the **middot `·`** as a separator and the em-dash. Status is shown with small colored **dots/pills**, not emoji.
- Do **not** hand-draw bespoke SVG icons — pull from Lucide. See `assets/ICONS.md`.

---

## Index / manifest

Root files:
- **`README.md`** — this file. Product context, sources, content & visual foundations, iconography.
- **`SKILL.md`** — Agent-Skill front-matter wrapper so this system can be used in Claude Code.
- **`colors_and_type.css`** — all design tokens (base palette + semantic aliases + type classes). Import first in every artifact.
- **`assets/`** — brand wordmark, icon usage notes (`ICONS.md`).
- **`preview/`** — small HTML specimen cards that populate the Design System tab (type, color, spacing, components).
- **`ui_kits/`** — high-fidelity, interactive recreations of the three Radia surfaces:
  - `ui_kits/user/` — the employee workspace (dashboard, tasks, **org chart**, onboarding, SOPs).
  - `ui_kits/workspace-admin/` — the creator/moderator management surface.
  - `ui_kits/server-admin/` — the platform operations console.

Start any new Radia design by importing `colors_and_type.css`, loading Geist + Lucide, and reusing components from the relevant UI kit.
