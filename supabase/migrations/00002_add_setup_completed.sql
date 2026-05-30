-- ============================================================
-- Add setup_completed flag to profiles
-- Tracks whether the user has completed the initial account
-- setup flow (choosing/creating an organization).
-- Separate from onboarding_completed which tracks learning courses.
-- ============================================================

alter table public.profiles
  add column if not exists setup_completed boolean not null default false;

-- Update the signup trigger to explicitly set setup_completed = false
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_workspace_id uuid;
  user_first text;
  user_last text;
  user_email text;
begin
  user_email := new.email;
  user_first := coalesce(new.raw_user_meta_data->>'first_name', split_part(user_email, '@', 1));
  user_last  := coalesce(new.raw_user_meta_data->>'last_name', '');

  -- Create a personal workspace
  insert into public.workspaces (name, subdomain)
  values (
    user_first || '''s Workspace',
    lower(replace(user_first || '-' || substr(new.id::text, 1, 8), ' ', '-'))
  )
  returning id into new_workspace_id;

  -- Create the profile linked to the auth user (setup_completed = false)
  insert into public.profiles (auth_user_id, workspace_id, email, first_name, last_name, role, setup_completed)
  values (new.id, new_workspace_id, user_email, user_first, user_last, 'creator', false);

  -- Create default notification preferences
  insert into public.notification_preferences (profile_id)
  values ((select id from public.profiles where auth_user_id = new.id));

  return new;
end;
$$ language plpgsql security definer;

-- Allow users to read all workspaces for the "Join Organization" domain check
-- (they need to see workspace names/subdomains to find matching orgs)
create policy "workspaces_read_for_join" on public.workspaces
  for select using (true);
