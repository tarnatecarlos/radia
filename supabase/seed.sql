-- Radia HR Platform - Seed Data
-- Run after the migration to populate demo data

-- Workspace
insert into public.workspaces (id, name, subdomain) values
  ('00000000-0000-0000-0000-000000000001', 'Radia Corp', 'radiacorp');

-- Profiles (auth_user_id left null for seed — link after sign-up)
insert into public.profiles (id, workspace_id, email, first_name, last_name, role, title, manager_id, onboarding_completed, started_date) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'alex.rivera@radiacorp.com',   'Alex',    'Rivera',   'creator',   'CEO & Founder',       null,                                          true,  '2024-01-15'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'sarah.chen@radiacorp.com',     'Sarah',   'Chen',     'moderator', 'HR Director',         '00000000-0000-0000-0000-000000000011', true,  '2024-02-01'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'marcus.johnson@radiacorp.com', 'Marcus',  'Johnson',  'moderator', 'Engineering Lead',    '00000000-0000-0000-0000-000000000011', true,  '2024-02-15'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'emily.park@radiacorp.com',     'Emily',   'Park',     'moderator', 'Design Lead',         '00000000-0000-0000-0000-000000000011', true,  '2024-03-01'),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'james.wilson@radiacorp.com',   'James',   'Wilson',   'user',      'Senior Engineer',     '00000000-0000-0000-0000-000000000013', true,  '2024-03-15'),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'lisa.nguyen@radiacorp.com',    'Lisa',    'Nguyen',   'user',      'Frontend Developer',  '00000000-0000-0000-0000-000000000013', false, '2024-06-01'),
  ('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'david.kim@radiacorp.com',      'David',   'Kim',      'user',      'UI/UX Designer',      '00000000-0000-0000-0000-000000000014', false, '2024-06-10'),
  ('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'rachel.garcia@radiacorp.com',  'Rachel',  'Garcia',   'user',      'Backend Engineer',    '00000000-0000-0000-0000-000000000013', true,  '2024-04-01'),
  ('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'tom.baker@radiacorp.com',      'Tom',     'Baker',    'moderator', 'Marketing Lead',      '00000000-0000-0000-0000-000000000011', true,  '2024-02-20'),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'anna.lee@radiacorp.com',       'Anna',    'Lee',      'user',      'Content Strategist',  '00000000-0000-0000-0000-000000000019', true,  '2024-05-01');

-- Tasks
insert into public.tasks (workspace_id, title, description, status, priority, creator_id, assignee_id, due_date, integration_source) values
  ('00000000-0000-0000-0000-000000000001', 'Set up CI/CD pipeline',            'Configure GitHub Actions for automated deployment to DigitalOcean',           'DONE',        'HIGH',   '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000013', '2024-07-15', 'github'),
  ('00000000-0000-0000-0000-000000000001', 'Design onboarding flow wireframes','Create Figma wireframes for the new employee onboarding experience',          'REVIEW',      'HIGH',   '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000014', '2024-07-20', null),
  ('00000000-0000-0000-0000-000000000001', 'Write company values SOP',         'Document core company values and culture guidelines for the knowledge base',   'IN_PROGRESS', 'MEDIUM', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', '2024-07-25', null),
  ('00000000-0000-0000-0000-000000000001', 'Implement Slack webhook integration','Build the API route handler for receiving Slack event callbacks',            'TODO',        'MEDIUM', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000015', '2024-07-30', 'slack'),
  ('00000000-0000-0000-0000-000000000001', 'Complete security audit checklist', 'Review RLS policies and ensure all endpoints have proper auth guards',        'TODO',        'HIGH',   '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000018', '2024-08-01', null),
  ('00000000-0000-0000-0000-000000000001', 'Create marketing launch page',     'Build a landing page for the Radia product launch announcement',              'IN_PROGRESS', 'LOW',    '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000020', '2024-08-05', null),
  ('00000000-0000-0000-0000-000000000001', 'Setup GitHub webhook receiver',    'Create /api/integrations/github/webhook route handler',                       'REVIEW',      'MEDIUM', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000015', '2024-07-22', 'github'),
  ('00000000-0000-0000-0000-000000000001', 'Onboard Lisa Nguyen',             'Assign mandatory courses and verify document uploads for new hire',            'IN_PROGRESS', 'HIGH',   '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000016', '2024-07-18', null),
  ('00000000-0000-0000-0000-000000000001', 'Brand guidelines document',        'Finalize brand colors, fonts, and logo usage guidelines',                     'DONE',        'MEDIUM', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000017', '2024-07-10', null),
  ('00000000-0000-0000-0000-000000000001', 'Configure Discord notifications',  'Set up Discord bot for onboarding milestone notifications',                   'TODO',        'LOW',    '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000015', '2024-08-10', 'discord');

-- Courses
insert into public.courses (id, workspace_id, title, description, is_mandatory) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Company Orientation',    'Learn about Radia Corp culture, values, and how we operate day-to-day.',                                   true),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Engineering Onboarding', 'Set up your development environment, learn our coding standards, and make your first PR.',                 true),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Security & Compliance',  'Mandatory security awareness training covering data handling, access controls, and incident response.',    true),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Design System Guide',    'Learn our visual design language, component library usage, and brand guidelines.',                         false);

-- Lessons
insert into public.lessons (course_id, title, content, sort_order, estimated_minutes) values
  ('00000000-0000-0000-0000-000000000101', 'Welcome to Radia',         '## Welcome\n\nThis lesson covers the fundamentals of our platform.', 1, 15),
  ('00000000-0000-0000-0000-000000000101', 'Our Mission & Values',     '## Mission\n\nWe build tools that help teams thrive.',               2, 10),
  ('00000000-0000-0000-0000-000000000101', 'Team Structure',           '## How Teams Work\n\nEach team has a lead who reports to the CEO.',   3, 10),
  ('00000000-0000-0000-0000-000000000101', 'Communication Channels',   '## Channels\n\nSlack for daily comms, email for formal requests.',    4,  8),
  ('00000000-0000-0000-0000-000000000102', 'Dev Environment Setup',    '## Setup Guide\n\n1. Clone the repo\n2. Install deps\n3. Run locally', 1, 30),
  ('00000000-0000-0000-0000-000000000102', 'Code Review Process',      '## Reviews\n\nAll PRs require at least one approval.',                 2, 15),
  ('00000000-0000-0000-0000-000000000102', 'Deployment Pipeline',      '## CI/CD\n\nWe use GitHub Actions with DigitalOcean.',                 3, 20),
  ('00000000-0000-0000-0000-000000000103', 'Data Classification',      '## Data Types\n\nLearn how we classify and protect data.',             1, 12),
  ('00000000-0000-0000-0000-000000000103', 'Access Control Policies',  '## RBAC\n\nUnderstand our role-based access system.',                   2, 15),
  ('00000000-0000-0000-0000-000000000104', 'Brand Identity',           '## Radia Brand\n\nOur design philosophy and color palette.',            1, 10),
  ('00000000-0000-0000-0000-000000000104', 'Component Library',        '## Components\n\nUsing Shadcn UI and our custom components.',           2, 20);

-- Integrations
insert into public.integrations (workspace_id, platform_name, is_active) values
  ('00000000-0000-0000-0000-000000000001', 'slack',     true),
  ('00000000-0000-0000-0000-000000000001', 'github',    true),
  ('00000000-0000-0000-0000-000000000001', 'gmail',     true),
  ('00000000-0000-0000-0000-000000000001', 'discord',   false),
  ('00000000-0000-0000-0000-000000000001', 'teams',     false),
  ('00000000-0000-0000-0000-000000000001', 'messenger', false);

-- Server admins
insert into public.server_admins (profile_id, server_role, granted_at) values
  ('00000000-0000-0000-0000-000000000011', 'super_admin', '2024-01-15');

-- Admin requests
insert into public.admin_requests (profile_id, requested_role, status, reason, created_at, reviewed_at) values
  ('00000000-0000-0000-0000-000000000011', 'super_admin', 'approved', 'Platform founder - need full infrastructure access.',                         '2024-01-15', '2024-01-15'),
  ('00000000-0000-0000-0000-000000000013', 'devops',      'pending',  'Need access to CI/CD pipelines and server logs for deployment management.',  '2024-07-10', null),
  ('00000000-0000-0000-0000-000000000012', 'auditor',     'rejected', 'Want to review platform audit trails for compliance reporting.',             '2024-06-20', '2024-06-22');

-- Audit log
insert into public.audit_log (workspace_id, actor_id, action, created_at) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Approved access request for Marcus Johnson',  '2024-07-18T14:32:00Z'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Workspace ''Radia Corp'' settings updated',   '2024-07-17T09:15:00Z'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'New integration configured: Gmail',            '2024-07-16T16:48:00Z');

-- Course enrollments for Lisa (u6) and David (u7)
insert into public.course_enrollments (profile_id, course_id, completed_lessons) values
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000101', '{1,2}'),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000102', '{1}'),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000103', '{}'),
  ('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000101', '{1,2,3}'),
  ('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000104', '{1}');

-- Notification preferences
insert into public.notification_preferences (profile_id) values
  ('00000000-0000-0000-0000-000000000011');
