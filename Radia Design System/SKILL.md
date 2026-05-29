---
name: radia-design
description: Use this skill to generate well-branded interfaces and assets for Radia (a modern HR management workspace — dashboard, tasks, org chart, onboarding, SOPs, integrations), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the three Radia surfaces (employee, workspace admin, server admin).
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

Key files:
- `README.md` — product context, sources, content + visual foundations, iconography.
- `colors_and_type.css` — all design tokens (base palette, semantic aliases, type classes). Import this first.
- `assets/` — Radia wordmark + icon usage notes (`ICONS.md`). Icons = Lucide.
- `preview/` — small specimen cards (type, color, spacing, components) showing the system.
- `ui_kits/{user,workspace-admin,server-admin}/` — high-fidelity, interactive recreations of the three Radia surfaces. Each kit's `index.html` boots a React app; components live in sibling `.jsx` files and share `ui_kits/shared/{data.js,ui.jsx}`.

Design notes (redesigned, clean + modern):
- Indigo (`#4f46e5`) is the single accent, used sparingly. Slate neutrals carry everything. Light-first.
- No glassmorphism, no gradient fills, no rainbow avatars (those were in the old build — retired). Flat white surfaces, hairline borders, soft shadows, 10px radii, Geist type, Lucide icons.
- Title Case for UI chrome, sentence case for body. No emoji.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and
create static HTML files for the user to view. If working on production code, copy assets and
read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_
production code, depending on the need.
