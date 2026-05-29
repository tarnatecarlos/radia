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
