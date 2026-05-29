# UI Kit · Employee Workspace (User surface)

The day-to-day surface for a regular employee (`role: user`). Read-mostly, calm,
focused on consuming the workspace.

**Run:** open `index.html`. Default screen is the **Org Chart** (the redesign focus).

## Screens
- **Dashboard** — greeting, KPI stat tiles, recent activity feed, onboarding overview, quick actions.
- **Tasks** — Kanban (drag cards between columns), List, and Table views; priority dots; integration source badges.
- **Org Chart** — clean person-cards on a dot-grid canvas. Drag to pan, scroll to zoom, **click a person** for a slide-in detail panel (manager, reports, onboarding, integrations). Toggle **Top-Down / Left-Right** layouts; "fit to screen" recenters.
- **Onboarding** — course cards with progress bars; required-course badges.
- **SOPs** — master/detail knowledge-base reader.

## Files
- `index.html` — loads React + Babel + Lucide + shared layer, mounts the app.
- `app.jsx` — AppShell wiring + per-screen topbar metadata.
- `OrgChart.jsx` · `Dashboard.jsx` · `Tasks.jsx` · `Onboarding.jsx` (also exports `Sops`).
- Shared: `../shared/data.js` (mock data + helpers → `window.RADIA`), `../shared/ui.jsx` (primitives + AppShell → `window.RUI`).
