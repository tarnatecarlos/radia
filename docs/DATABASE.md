# Radia — Database Setup (Supabase)

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works)
- A new Supabase project created

---

## Schema Overview

```
workspaces
  └── profiles (employees, linked to Supabase Auth)
        ├── tasks
        ├── sops (Standard Operating Procedures)
        ├── courses
        │     └── lessons
        ├── course_enrollments
        ├── integrations
        ├── server_admins
        ├── admin_requests
        ├── audit_log
        └── notification_preferences
```

**12 tables** · **6 custom enums** · **2 triggers** · **27 RLS policies**

---

## Step 1: Run the Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open `supabase/migrations/00001_initial_schema.sql` from this repo
5. Copy the entire file contents and paste into the SQL editor
6. Click **Run**

You should see `Success. No rows returned` — this means all tables, types, indexes, triggers, and policies were created.

### What gets created

| Type | Count | Details |
|------|-------|---------|
| Tables | 12 | workspaces, profiles, sops, tasks, courses, lessons, course_enrollments, integrations, server_admins, admin_requests, audit_log, notification_preferences |
| Enums | 6 | workspace_role, task_status, task_priority, server_role, admin_request_status |
| Indexes | 12 | On workspace_id, manager_id, status, assignee_id, course_id, profile_id, created_at |
| Triggers | 2 | Auto-update `updated_at` on tasks and sops |
| RLS Policies | 27 | Per-table read/write policies scoped to workspace membership and roles |

### Table creation order

Tables are created in dependency order to avoid foreign key issues:

```
1. workspaces        (no dependencies)
2. profiles          (→ workspaces, → auth.users)
3. sops              (→ workspaces, → profiles)
4. tasks             (→ workspaces, → profiles, → sops)
5. courses           (→ workspaces)
6. lessons           (→ courses)
7. course_enrollments (→ profiles, → courses)
8. integrations      (→ workspaces)
9. server_admins     (→ profiles)
10. admin_requests   (→ profiles)
11. audit_log        (→ workspaces, → profiles)
12. notification_preferences (→ profiles)
```

---

## Step 2: Seed Demo Data (Optional)

To populate the database with sample data for development:

1. In the SQL Editor, click **New Query**
2. Open `supabase/seed.sql` from this repo
3. Paste and **Run**

### What gets seeded

| Table | Records | Notes |
|-------|---------|-------|
| workspaces | 1 | "Radia Corp" |
| profiles | 10 | CEO, HR, Engineering, Design, Marketing teams |
| tasks | 10 | Mix of statuses and priorities |
| courses | 4 | 3 mandatory + 1 optional |
| lessons | 11 | Across all 4 courses |
| course_enrollments | 5 | For Lisa (u6) and David (u7) |
| integrations | 6 | Slack, GitHub, Gmail active; Discord, Teams, Messenger inactive |
| server_admins | 1 | Alex Rivera as super_admin |
| admin_requests | 3 | 1 approved, 1 pending, 1 rejected |
| audit_log | 3 | Sample admin actions |
| notification_preferences | 1 | Default prefs for Alex |

---

## Step 3: Link Auth Users to Profiles

The seed data inserts profiles with `auth_user_id = NULL`. After creating real users through Supabase Auth (sign-up flow or dashboard), link them:

```sql
-- Link a signed-up user to their profile
update public.profiles
set auth_user_id = 'PASTE-AUTH-USER-UUID-HERE'
where email = 'alex.rivera@radiacorp.com';
```

To find a user's auth UUID:
1. Go to **Authentication → Users** in Supabase dashboard
2. Copy the UUID from the user row

> **Important**: RLS policies use `auth.uid()` to match `auth_user_id`. Until this column is populated, authenticated users won't see any data through the client SDK.

---

## Step 4: Get API Keys

Go to **Settings → API** in your Supabase dashboard:

| Key | Environment Variable | Exposed to Client? |
|-----|---------------------|--------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (safe — RLS protects data) |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` | **No** — server-side only, bypasses RLS |

Create a `.env.local` file from the template:

```bash
cp .env.local.example .env.local
```

Then fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
```

---

## RLS Policy Reference

All tables have Row Level Security enabled. Here's what each role can do:

### Workspace data (tasks, sops, courses, integrations)

| Action | Creator | Moderator | User |
|--------|---------|-----------|------|
| Read own workspace | Yes | Yes | Yes |
| Create tasks | Yes | Yes | Yes |
| Update/delete tasks | Yes | Yes | Yes |
| Create/edit/delete SOPs | Yes | Yes | No |
| Manage integrations | Yes | Yes | No |

### Profiles

| Action | Who |
|--------|-----|
| Read workspace members | All workspace members |
| Update own profile | Self only |
| Add new members | Creator or Moderator |

### Admin (server-level)

| Action | Who |
|--------|-----|
| View server admins | Server admins + own record |
| View admin requests | Server admins + own request |
| Submit access request | Any authenticated user |
| Approve/reject requests | Server admins only |
| View audit log | Server admins only |

### Personal

| Action | Who |
|--------|-----|
| Course enrollments (read/update) | Self only |
| Notification preferences | Self only |

---

## Useful Queries

### Check table row counts

```sql
select
  'workspaces' as tbl, count(*) from workspaces
union all select 'profiles', count(*) from profiles
union all select 'tasks', count(*) from tasks
union all select 'sops', count(*) from sops
union all select 'courses', count(*) from courses
union all select 'lessons', count(*) from lessons
union all select 'enrollments', count(*) from course_enrollments
union all select 'integrations', count(*) from integrations
union all select 'server_admins', count(*) from server_admins
union all select 'admin_requests', count(*) from admin_requests
union all select 'audit_log', count(*) from audit_log
union all select 'notification_prefs', count(*) from notification_preferences;
```

### View org chart hierarchy

```sql
with recursive org as (
  select id, first_name, last_name, title, manager_id, 0 as depth
  from profiles where manager_id is null
  union all
  select p.id, p.first_name, p.last_name, p.title, p.manager_id, o.depth + 1
  from profiles p join org o on p.manager_id = o.id
)
select repeat('  ', depth) || first_name || ' ' || last_name || ' — ' || coalesce(title, '') as org_tree
from org order by depth, last_name;
```

### Reset all data (development only)

```sql
-- WARNING: Deletes everything. Only use in development.
truncate public.notification_preferences,
         public.audit_log,
         public.admin_requests,
         public.server_admins,
         public.integrations,
         public.course_enrollments,
         public.lessons,
         public.courses,
         public.tasks,
         public.sops,
         public.profiles,
         public.workspaces
cascade;
```

Then re-run `seed.sql` to repopulate.
