# Radia Iconography

**Library:** [Lucide](https://lucide.dev) (the product uses `lucide-react`).

Lucide is the canonical Radia icon set — outline style, ~1.5–2px stroke, rounded
caps/joins, 24×24 grid. Do not mix in filled or duotone icon sets.

## Loading in HTML artifacts
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<!-- use data attributes, then call lucide.createIcons() -->
<i data-lucide="layout-dashboard"></i>
<script>lucide.createIcons();</script>
```
Lucide names are kebab-case (`layout-dashboard`, `check-square`, `git-branch`).

## Usage rules
- Size **16–20px** in UI (nav 18px, inline 14–16px). Stroke inherits via `currentColor`.
- Color icons `--fg-2`/`--fg-3` at rest, `--accent` (indigo) when active/selected.
- **No emoji. No Unicode pictographs as icons.** Status = colored dot/pill, not emoji.
- Do not hand-draw bespoke SVG icons; pull from Lucide.

## Icons used across the product
Navigation: `layout-dashboard, check-square, network, graduation-cap, book-open,
plug, settings, shield`
Actions: `plus, user-plus, file-text, arrow-right, arrow-down, rotate-ccw,
zoom-in, zoom-out, maximize, grip-vertical`
Status / admin: `clock, activity, database, hard-drive, alert-triangle, building,
user-check, user-x, users, sun, moon`

## Integration brand glyphs
Slack, GitHub, Gmail, Discord, Teams, Messenger are real third-party brands. Use
their official marks (e.g. [Simple Icons](https://simpleicons.org)) with their
brand colors for integration tiles — never approximate with Lucide. In compact
places (sidebar status), a brand-colored dot + the platform name is enough.

Brand-color reference (from the codebase):
`slack #E01E5A · github #181717 · gmail #EA4335 · discord #5865F2 · teams #6264A7 · messenger #0084FF`
