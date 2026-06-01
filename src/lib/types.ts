// Workspace-level roles
export type WorkspaceRole = 'creator' | 'moderator' | 'user';

// Server-level admin roles (separate from workspace)
export type ServerRole = 'super_admin' | 'devops' | 'auditor';

export type AdminRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AdminRequest {
  id: string;
  profile_id: string;
  requested_role: ServerRole;
  status: AdminRequestStatus;
  reason: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface ServerAdmin {
  id: string;
  profile_id: string;
  server_role: ServerRole;
  granted_at: string;
  granted_by?: string;
}

export interface Workspace {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  workspace_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: WorkspaceRole;
  title?: string;
  manager_id?: string | null;
  onboarding_completed: boolean;
  setup_completed: boolean;
  started_date: string;
  created_at: string;
  avatar_url?: string;
}

export interface SOP {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  category: string;
  version: number;
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  is_mandatory: boolean;
  created_at: string;
  lessons?: Lesson[];
  enrollment?: CourseEnrollment;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  sort_order: number;
  estimated_minutes: number;
}

export interface CourseEnrollment {
  id: string;
  profile_id: string;
  course_id: string;
  completed_lessons: number[];
  completed_at?: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  creator_id?: string;
  assignee_id?: string;
  assignee?: Profile;
  due_date?: string;
  sop_reference_id?: string;
  created_at: string;
  updated_at: string;
  integration_source?: string;
}

export interface Integration {
  id: string;
  workspace_id: string;
  platform_name: string;
  is_active: boolean;
  created_at: string;
}

export interface OrgNode extends Profile {
  children: OrgNode[];
  depth: number;
}

export interface WorkspacePreferences {
  id: string;
  workspace_id: string;
  members_can_create_tasks: boolean;
  members_can_create_sops: boolean;
  members_can_create_courses: boolean;
  members_can_manage_integrations: boolean;
  allowed_integrations: string[];
}

// ── Performance Management ──────────────────────

export interface Skill {
  id: string;
  workspace_id: string;
  name: string;
  category: string;
  created_at: string;
}

export type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SkillSource = 'manual' | 'certification' | 'review';

export interface ProfileSkill {
  id: string;
  profile_id: string;
  skill_id: string;
  proficiency: Proficiency;
  source: SkillSource;
  verified_at?: string;
  skill?: Skill;
}

export type ReviewCycleStatus = 'draft' | 'active' | 'completed';

export interface ReviewCycle {
  id: string;
  workspace_id: string;
  name: string;
  quarter: string;
  start_date: string;
  end_date: string;
  status: ReviewCycleStatus;
  created_at: string;
  review_count?: number;
  completed_count?: number;
}

export type ObjectiveStatus = 'on_track' | 'at_risk' | 'behind' | 'completed';

export interface Objective {
  id: string;
  workspace_id: string;
  profile_id: string;
  review_cycle_id?: string;
  title: string;
  description?: string;
  metric?: string;
  target_value?: number;
  current_value: number;
  status: ObjectiveStatus;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export type ReviewStatus = 'pending' | 'in_progress' | 'submitted';

export interface Review {
  id: string;
  review_cycle_id: string;
  reviewee_id: string;
  reviewer_id: string;
  rating?: number;
  summary?: string;
  strengths?: string;
  improvements?: string;
  status: ReviewStatus;
  submitted_at?: string;
  created_at: string;
  reviewee?: Profile;
  reviewer?: Profile;
  skill_gaps?: ReviewSkillGap[];
}

export interface ReviewSkillGap {
  id: string;
  review_id: string;
  skill_id: string;
  recommended_course_id?: string;
  notes?: string;
  resolved: boolean;
  created_at: string;
  skill?: Skill;
  course?: Course;
}

export interface Certification {
  id: string;
  profile_id: string;
  course_id: string;
  skill_id?: string;
  issued_at: string;
  expires_at?: string;
  course?: Course;
  skill?: Skill;
}
