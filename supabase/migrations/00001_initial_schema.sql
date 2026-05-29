-- ============================================================
-- Radia HR Platform — Initial Schema
-- ============================================================
-- Run this against your Supabase project via the SQL Editor
-- or the Supabase CLI: supabase db push
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. WORKSPACES
-- ============================================================
create table public.workspaces (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  subdomain   text unique not null,
  logo_url    text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 2. PROFILES (linked to Supabase Auth)
-- ============================================================
create type public.workspace_role as enum ('creator', 'moderator', 'user');

create table public.profiles (
  id                    uuid primary key default uuid_generate_v4(),
  auth_user_id          uuid unique references auth.users(id) on delete cascade,
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  email                 text not null,
  first_name            text not null,
  last_name             text not null,
  role                  public.workspace_role not null default 'user',
  title                 text,
  manager_id            uuid references public.profiles(id) on delete set null,
  onboarding_completed  boolean not null default false,
  started_date          date not null default current_date,
  avatar_url            text,
  created_at            timestamptz not null default now()
);

create index idx_profiles_workspace on public.profiles(workspace_id);
create index idx_profiles_manager   on public.profiles(manager_id);

-- ============================================================
-- 3. SOPS (must come before tasks — tasks FK-references sops)
-- ============================================================
create table public.sops (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  title           text not null,
  content         text not null default '',
  category        text not null default 'General',
  version         integer not null default 1,
  last_updated_by uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_sops_workspace on public.sops(workspace_id);

-- ============================================================
-- 4. TASKS
-- ============================================================
create type public.task_status   as enum ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
create type public.task_priority as enum ('LOW', 'MEDIUM', 'HIGH');

create table public.tasks (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  title               text not null,
  description         text,
  status              public.task_status not null default 'TODO',
  priority            public.task_priority not null default 'MEDIUM',
  creator_id          uuid references public.profiles(id) on delete set null,
  assignee_id         uuid references public.profiles(id) on delete set null,
  due_date            timestamptz,
  sop_reference_id    uuid references public.sops(id) on delete set null,
  integration_source  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_tasks_workspace on public.tasks(workspace_id);
create index idx_tasks_status    on public.tasks(status);
create index idx_tasks_assignee  on public.tasks(assignee_id);

-- ============================================================
-- 5. COURSES & LESSONS
-- ============================================================
create table public.courses (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  title         text not null,
  description   text,
  is_mandatory  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_courses_workspace on public.courses(workspace_id);

create table public.lessons (
  id                uuid primary key default uuid_generate_v4(),
  course_id         uuid not null references public.courses(id) on delete cascade,
  title             text not null,
  content           text not null default '',
  sort_order        integer not null default 0,
  estimated_minutes integer not null default 5
);

create index idx_lessons_course on public.lessons(course_id);

-- ============================================================
-- 6. COURSE ENROLLMENTS
-- ============================================================
create table public.course_enrollments (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  course_id         uuid not null references public.courses(id) on delete cascade,
  completed_lessons integer[] not null default '{}',
  completed_at      timestamptz,
  unique (profile_id, course_id)
);

create index idx_enrollments_profile on public.course_enrollments(profile_id);

-- ============================================================
-- 7. INTEGRATIONS
-- ============================================================
create table public.integrations (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  platform_name  text not null,
  is_active      boolean not null default false,
  config         jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

create index idx_integrations_workspace on public.integrations(workspace_id);

-- ============================================================
-- 8. SERVER ADMIN ROLES
-- ============================================================
create type public.server_role          as enum ('super_admin', 'devops', 'auditor');
create type public.admin_request_status as enum ('pending', 'approved', 'rejected');

create table public.server_admins (
  id           uuid primary key default uuid_generate_v4(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  server_role  public.server_role not null,
  granted_at   timestamptz not null default now(),
  granted_by   uuid references public.profiles(id) on delete set null
);

create index idx_server_admins_profile on public.server_admins(profile_id);

create table public.admin_requests (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  requested_role  public.server_role not null,
  status          public.admin_request_status not null default 'pending',
  reason          text not null default '',
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles(id) on delete set null
);

create index idx_admin_requests_status on public.admin_requests(status);

-- ============================================================
-- 9. AUDIT LOG
-- ============================================================
create table public.audit_log (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,
  action       text not null,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index idx_audit_log_workspace on public.audit_log(workspace_id);
create index idx_audit_log_created   on public.audit_log(created_at desc);

-- ============================================================
-- 10. NOTIFICATION PREFERENCES
-- ============================================================
create table public.notification_preferences (
  id               uuid primary key default uuid_generate_v4(),
  profile_id       uuid unique not null references public.profiles(id) on delete cascade,
  email_digest     boolean not null default true,
  email_mentions   boolean not null default true,
  slack_updates    boolean not null default true,
  slack_milestones boolean not null default false,
  in_app_all       boolean not null default true,
  in_app_tasks     boolean not null default true
);

-- ============================================================
-- TRIGGERS — auto-set updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

create trigger set_sops_updated_at
  before update on public.sops
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.workspaces               enable row level security;
alter table public.profiles                 enable row level security;
alter table public.tasks                    enable row level security;
alter table public.sops                     enable row level security;
alter table public.courses                  enable row level security;
alter table public.lessons                  enable row level security;
alter table public.course_enrollments       enable row level security;
alter table public.integrations             enable row level security;
alter table public.server_admins            enable row level security;
alter table public.admin_requests           enable row level security;
alter table public.audit_log                enable row level security;
alter table public.notification_preferences enable row level security;

-- ── Workspaces ──────────────────────────────────────────────
create policy "workspace_members_read" on public.workspaces
  for select using (
    id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

create policy "workspace_creator_update" on public.workspaces
  for update using (
    id in (
      select workspace_id from public.profiles
      where auth_user_id = auth.uid() and role = 'creator'
    )
  );

create policy "workspace_creator_delete" on public.workspaces
  for delete using (
    id in (
      select workspace_id from public.profiles
      where auth_user_id = auth.uid() and role = 'creator'
    )
  );

-- ── Profiles ────────────────────────────────────────────────
create policy "profiles_workspace_read" on public.profiles
  for select using (
    workspace_id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

create policy "profiles_self_update" on public.profiles
  for update using (auth_user_id = auth.uid());

create policy "profiles_creator_insert" on public.profiles
  for insert with check (
    workspace_id in (
      select workspace_id from public.profiles
      where auth_user_id = auth.uid() and role in ('creator', 'moderator')
    )
  );

-- ── Tasks ───────────────────────────────────────────────────
create policy "tasks_workspace_read" on public.tasks
  for select using (
    workspace_id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

create policy "tasks_workspace_insert" on public.tasks
  for insert with check (
    workspace_id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

create policy "tasks_workspace_update" on public.tasks
  for update using (
    workspace_id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

create policy "tasks_workspace_delete" on public.tasks
  for delete using (
    workspace_id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

-- ── SOPs ────────────────────────────────────────────────────
create policy "sops_workspace_read" on public.sops
  for select using (
    workspace_id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

create policy "sops_moderator_insert" on public.sops
  for insert with check (
    workspace_id in (
      select workspace_id from public.profiles
      where auth_user_id = auth.uid() and role in ('creator', 'moderator')
    )
  );

create policy "sops_moderator_update" on public.sops
  for update using (
    workspace_id in (
      select workspace_id from public.profiles
      where auth_user_id = auth.uid() and role in ('creator', 'moderator')
    )
  );

create policy "sops_moderator_delete" on public.sops
  for delete using (
    workspace_id in (
      select workspace_id from public.profiles
      where auth_user_id = auth.uid() and role in ('creator', 'moderator')
    )
  );

-- ── Courses & Lessons ───────────────────────────────────────
create policy "courses_workspace_read" on public.courses
  for select using (
    workspace_id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

create policy "lessons_course_read" on public.lessons
  for select using (
    course_id in (
      select c.id from public.courses c
      join public.profiles p on p.workspace_id = c.workspace_id
      where p.auth_user_id = auth.uid()
    )
  );

-- ── Course Enrollments ──────────────────────────────────────
create policy "enrollments_self_read" on public.course_enrollments
  for select using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "enrollments_self_insert" on public.course_enrollments
  for insert with check (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "enrollments_self_update" on public.course_enrollments
  for update using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- ── Integrations ────────────────────────────────────────────
create policy "integrations_workspace_read" on public.integrations
  for select using (
    workspace_id in (select workspace_id from public.profiles where auth_user_id = auth.uid())
  );

create policy "integrations_moderator_update" on public.integrations
  for update using (
    workspace_id in (
      select workspace_id from public.profiles
      where auth_user_id = auth.uid() and role in ('creator', 'moderator')
    )
  );

-- ── Server Admins ───────────────────────────────────────────
create policy "server_admins_read" on public.server_admins
  for select using (
    -- Own record, or you are already a server admin
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
    or exists (
      select 1 from public.server_admins sa
      join public.profiles p on p.id = sa.profile_id
      where p.auth_user_id = auth.uid()
    )
  );

-- ── Admin Requests ──────────────────────────────────────────
create policy "admin_requests_read" on public.admin_requests
  for select using (
    -- Own request, or you are a server admin
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
    or exists (
      select 1 from public.server_admins sa
      join public.profiles p on p.id = sa.profile_id
      where p.auth_user_id = auth.uid()
    )
  );

create policy "admin_requests_insert" on public.admin_requests
  for insert with check (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "admin_requests_update" on public.admin_requests
  for update using (
    -- Only server admins can approve/reject
    exists (
      select 1 from public.server_admins sa
      join public.profiles p on p.id = sa.profile_id
      where p.auth_user_id = auth.uid()
    )
  );

-- ── Audit Log ───────────────────────────────────────────────
create policy "audit_log_admin_read" on public.audit_log
  for select using (
    exists (
      select 1 from public.server_admins sa
      join public.profiles p on p.id = sa.profile_id
      where p.auth_user_id = auth.uid()
    )
  );

create policy "audit_log_insert" on public.audit_log
  for insert with check (
    actor_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- ── Notification Preferences ────────────────────────────────
create policy "notification_prefs_self_read" on public.notification_preferences
  for select using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "notification_prefs_self_insert" on public.notification_preferences
  for insert with check (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy "notification_prefs_self_update" on public.notification_preferences
  for update using (
    profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  );
