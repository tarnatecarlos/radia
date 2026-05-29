# UI Kit · Server Admin (platform operations console)

The platform-level surface for server admins (`server_role: super_admin | devops | auditor`),
separate from any single workspace. A deliberately more serious "operations console"
with caution cues (amber/red) around destructive, platform-wide power.

**Run:** open `index.html`. Default screen is **Overview**.

## Screens
- **Overview** — server-level access warning banner + System Health tiles (database, API, storage, uptime) + platform stats.
- **Access Requests** — table of server-role requests with inline Approve / Reject.
- **Server Admins** — cards of users holding platform access, with role + grant date.
- **Workspaces** — every workspace with member/SOP/course counts and Pause / Delete actions.
- **Audit Log** — chronological server-level activity trail.

## Files
- `index.html`, `app.jsx`
- `Console.jsx` (exports `Overview`, `AccessRequests`, `ServerAdminsScreen`, `Workspaces`, `AuditLog`).
- Shared: `../shared/data.js`, `../shared/ui.jsx`.
