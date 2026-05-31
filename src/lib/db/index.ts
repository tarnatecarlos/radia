import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "radia.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- Users (replaces Supabase auth.users)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    -- Workspaces
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Profiles
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('creator','moderator','user')),
      title TEXT,
      manager_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      setup_completed INTEGER NOT NULL DEFAULT 0,
      started_date TEXT NOT NULL DEFAULT (date('now')),
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_manager ON profiles(manager_id);

    -- SOPs
    CREATE TABLE IF NOT EXISTS sops (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'General',
      version INTEGER NOT NULL DEFAULT 1,
      last_updated_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sops_workspace ON sops(workspace_id);

    -- Tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'TODO' CHECK(status IN ('TODO','IN_PROGRESS','REVIEW','DONE')),
      priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW','MEDIUM','HIGH')),
      creator_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      assignee_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      due_date TEXT,
      sop_reference_id TEXT REFERENCES sops(id) ON DELETE SET NULL,
      integration_source TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);

    -- Courses
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      is_mandatory INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_courses_workspace ON courses(workspace_id);

    -- Lessons
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      estimated_minutes INTEGER NOT NULL DEFAULT 5
    );
    CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);

    -- Course Enrollments
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      completed_lessons TEXT NOT NULL DEFAULT '[]',
      completed_at TEXT,
      UNIQUE(profile_id, course_id)
    );
    CREATE INDEX IF NOT EXISTS idx_enrollments_profile ON course_enrollments(profile_id);

    -- Integrations
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      platform_name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      config TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);

    -- Server Admins
    CREATE TABLE IF NOT EXISTS server_admins (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      server_role TEXT NOT NULL CHECK(server_role IN ('super_admin','devops','auditor')),
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      granted_by TEXT REFERENCES profiles(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_server_admins_profile ON server_admins(profile_id);

    -- Admin Requests
    CREATE TABLE IF NOT EXISTS admin_requests (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      requested_role TEXT NOT NULL CHECK(requested_role IN ('super_admin','devops','auditor')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      reviewed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);

    -- Audit Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_log_workspace ON audit_log(workspace_id);

    -- Notification Preferences
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      profile_id TEXT UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      email_digest INTEGER NOT NULL DEFAULT 1,
      email_mentions INTEGER NOT NULL DEFAULT 1,
      slack_updates INTEGER NOT NULL DEFAULT 1,
      slack_milestones INTEGER NOT NULL DEFAULT 0,
      in_app_all INTEGER NOT NULL DEFAULT 1,
      in_app_tasks INTEGER NOT NULL DEFAULT 1
    );

    -- Invites
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      email TEXT,
      token TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('creator','moderator','user')),
      invited_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      accepted_at TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
    CREATE INDEX IF NOT EXISTS idx_invites_workspace ON invites(workspace_id);

    -- Workspace Preferences
    CREATE TABLE IF NOT EXISTS workspace_preferences (
      id TEXT PRIMARY KEY,
      workspace_id TEXT UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      members_can_create_tasks INTEGER NOT NULL DEFAULT 1,
      members_can_create_sops INTEGER NOT NULL DEFAULT 0,
      members_can_create_courses INTEGER NOT NULL DEFAULT 0,
      members_can_manage_integrations INTEGER NOT NULL DEFAULT 0,
      allowed_integrations TEXT NOT NULL DEFAULT '["slack","github","gmail","discord","teams","messenger"]'
    );
  `);
}

export function uid(): string {
  return crypto.randomUUID();
}
