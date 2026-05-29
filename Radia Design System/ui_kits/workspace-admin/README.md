# UI Kit · Workspace Admin (creator / moderator surface)

The management surface for workspace owners and moderators (`role: creator | moderator`).
Full create/edit affordances over the workspace's people and content.

**Run:** open `index.html`. Default screen is **People**.

## Screens
- **People** — member table with role badges, onboarding status, search + role filters, KPI tiles, and an **Invite member** modal.
- **SOPs** — authoring view: SOP list + a simple editor with formatting toolbar and a Publish-version action.
- **Onboarding** — course builder: course cards with lesson counts, assigned-learner avatars, and Assign actions.
- **Integrations** — webhook config tiles with connect/disconnect toggles and per-platform webhook URLs.

## Files
- `index.html`, `app.jsx`
- `Members.jsx` (People), `Manage.jsx` (exports `SopsAdmin`, `CoursesAdmin`, `IntegrationsAdmin`).
- Shared: `../shared/data.js`, `../shared/ui.jsx`.
