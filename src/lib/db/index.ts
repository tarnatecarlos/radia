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

    -- ═══════════════════════════════════════════════
    -- Performance Management & Cross-Module Tables
    -- ═══════════════════════════════════════════════

    -- Skills catalog (workspace-level)
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(workspace_id, name)
    );
    CREATE INDEX IF NOT EXISTS idx_skills_workspace ON skills(workspace_id);

    -- Junction: profile ↔ skill (the skills matrix)
    CREATE TABLE IF NOT EXISTS profile_skills (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      proficiency TEXT NOT NULL DEFAULT 'beginner' CHECK(proficiency IN ('beginner','intermediate','advanced','expert')),
      source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','certification','review')),
      verified_at TEXT,
      UNIQUE(profile_id, skill_id)
    );
    CREATE INDEX IF NOT EXISTS idx_profile_skills_profile ON profile_skills(profile_id);

    -- Review cycles (quarterly)
    CREATE TABLE IF NOT EXISTS review_cycles (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      quarter TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_review_cycles_workspace ON review_cycles(workspace_id);

    -- OKRs / Objectives
    CREATE TABLE IF NOT EXISTS objectives (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      review_cycle_id TEXT REFERENCES review_cycles(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      metric TEXT,
      target_value REAL,
      current_value REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'on_track' CHECK(status IN ('on_track','at_risk','behind','completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_objectives_profile ON objectives(profile_id);
    CREATE INDEX IF NOT EXISTS idx_objectives_cycle ON objectives(review_cycle_id);

    -- Individual reviews (within a cycle)
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      review_cycle_id TEXT NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
      reviewee_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      summary TEXT,
      strengths TEXT,
      improvements TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','submitted')),
      submitted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_cycle ON reviews(review_cycle_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);

    -- Skill gaps flagged in reviews → triggers LMS recommendation
    CREATE TABLE IF NOT EXISTS review_skill_gaps (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      recommended_course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
      notes TEXT,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_review_skill_gaps_review ON review_skill_gaps(review_id);

    -- Certifications (earned on course completion)
    CREATE TABLE IF NOT EXISTS certifications (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      skill_id TEXT REFERENCES skills(id) ON DELETE SET NULL,
      issued_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT,
      UNIQUE(profile_id, course_id)
    );
    CREATE INDEX IF NOT EXISTS idx_certifications_profile ON certifications(profile_id);

    -- Course ↔ Skill mapping (which skills a course teaches)
    CREATE TABLE IF NOT EXISTS course_skills (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(course_id, skill_id)
    );
    CREATE INDEX IF NOT EXISTS idx_course_skills_course ON course_skills(course_id);

    -- Additional performance indexes
    CREATE INDEX IF NOT EXISTS idx_objectives_workspace ON objectives(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);

    -- ═══════════════════════════════════════════════
    -- API Keys (org-level access tokens)
    -- ═══════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      scopes TEXT NOT NULL DEFAULT '["read"]',
      created_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT,
      revoked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON api_keys(workspace_id);
  `);
}

export function uid(): string {
  return crypto.randomUUID();
}
