-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  RADIA — Supabase Seed Data                                 ║
-- ║  Run AFTER schema.sql in the Supabase SQL Editor             ║
-- ║  Creates admin + 5 employees with full demo data             ║
-- ║                                                              ║
-- ║  Admin login: admin@radiacorp.com / password123              ║
-- ║  All employees also use: password123                         ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- The password hash below is bcrypt(12 rounds) of "password123"
-- Generate new hashes at https://bcrypt-generator.com/ if needed.

DO $$
DECLARE
  pw TEXT := '$2a$12$LJ3m4ys3GIf/3RCcIbMC9.DJZtnOBCBBgY2t6pUVafIoXQ5lMbGjO';
  admin_uid UUID := gen_random_uuid();
  sarah_uid UUID := gen_random_uuid();
  marcus_uid UUID := gen_random_uuid();
  priya_uid UUID := gen_random_uuid();
  james_uid UUID := gen_random_uuid();
  lin_uid UUID := gen_random_uuid();
  ws UUID := gen_random_uuid();
  p_admin UUID := gen_random_uuid();
  p_sarah UUID := gen_random_uuid();
  p_marcus UUID := gen_random_uuid();
  p_priya UUID := gen_random_uuid();
  p_james UUID := gen_random_uuid();
  p_lin UUID := gen_random_uuid();
  c1 UUID := gen_random_uuid();
  c2 UUID := gen_random_uuid();
  c3 UUID := gen_random_uuid();
  cy1 UUID := gen_random_uuid();
  cy2 UUID := gen_random_uuid();
  sk_js UUID := gen_random_uuid(); sk_ts UUID := gen_random_uuid();
  sk_react UUID := gen_random_uuid(); sk_node UUID := gen_random_uuid();
  sk_py UUID := gen_random_uuid(); sk_devops UUID := gen_random_uuid();
  sk_sql UUID := gen_random_uuid(); sk_git UUID := gen_random_uuid();
  sk_ui UUID := gen_random_uuid(); sk_ux UUID := gen_random_uuid();
  sk_figma UUID := gen_random_uuid(); sk_recruit UUID := gen_random_uuid();
  sk_perf UUID := gen_random_uuid(); sk_er UUID := gen_random_uuid();
  sk_lead UUID := gen_random_uuid(); sk_comm UUID := gen_random_uuid();
  sk_pm UUID := gen_random_uuid();
BEGIN

-- Users
INSERT INTO users (id, email, password_hash) VALUES
  (admin_uid, 'admin@radiacorp.com', pw), (sarah_uid, 'sarah@radiacorp.com', pw),
  (marcus_uid, 'marcus@radiacorp.com', pw), (priya_uid, 'priya@radiacorp.com', pw),
  (james_uid, 'james@radiacorp.com', pw), (lin_uid, 'lin@radiacorp.com', pw);

-- Workspace
INSERT INTO workspaces (id, name, subdomain) VALUES (ws, 'Radia Corp', 'radiacorp');

-- Profiles
INSERT INTO profiles (id, user_id, workspace_id, email, first_name, last_name, role, title, manager_id, onboarding_completed, setup_completed, started_date) VALUES
  (p_admin, admin_uid, ws, 'admin@radiacorp.com', 'Claude', 'Admin', 'creator', 'CTO & AI Operations Lead', NULL, TRUE, TRUE, CURRENT_DATE - 180),
  (p_sarah, sarah_uid, ws, 'sarah@radiacorp.com', 'Sarah', 'Chen', 'moderator', 'VP Engineering', p_admin, TRUE, TRUE, CURRENT_DATE - 150),
  (p_marcus, marcus_uid, ws, 'marcus@radiacorp.com', 'Marcus', 'Rivera', 'user', 'Senior Developer', p_sarah, TRUE, TRUE, CURRENT_DATE - 120),
  (p_priya, priya_uid, ws, 'priya@radiacorp.com', 'Priya', 'Patel', 'user', 'UX Designer', p_sarah, FALSE, TRUE, CURRENT_DATE - 30),
  (p_james, james_uid, ws, 'james@radiacorp.com', 'James', 'Okafor', 'moderator', 'HR Manager', p_admin, TRUE, TRUE, CURRENT_DATE - 90),
  (p_lin, lin_uid, ws, 'lin@radiacorp.com', 'Lin', 'Wei', 'user', 'DevOps Engineer', p_sarah, FALSE, TRUE, CURRENT_DATE - 14);

INSERT INTO notification_preferences (profile_id) VALUES (p_admin),(p_sarah),(p_marcus),(p_priya),(p_james),(p_lin);
INSERT INTO server_admins (profile_id, server_role, granted_by) VALUES (p_admin, 'super_admin', p_admin);
INSERT INTO workspace_preferences (workspace_id, members_can_create_tasks) VALUES (ws, TRUE);

-- Integrations
INSERT INTO integrations (workspace_id, platform_name, is_active) VALUES
  (ws,'slack',TRUE),(ws,'github',TRUE),(ws,'gmail',FALSE),(ws,'discord',TRUE),(ws,'teams',FALSE),(ws,'messenger',FALSE);

-- SOPs
INSERT INTO sops (workspace_id, title, content, category, version, last_updated_by) VALUES
  (ws, 'Code Review Standards', E'# Code Review Standards\n\n## Purpose\nEstablish consistent code review practices.\n\n## Process\n1. Submit all changes as pull requests\n2. **One approval** required before merging\n3. Reviews within 24 hours\n\n## Checklist\n- [ ] Follows style guidelines\n- [ ] Tests included\n- [ ] Docs updated\n\n| Type | Reviewers |\n| --- | --- |\n| Standard | 1 |\n| Critical | 2 |', 'Engineering', 3, p_admin),
  (ws, 'New Employee Onboarding', E'# Onboarding Checklist\n\n## First Day\n- [ ] HR paperwork\n- [ ] Equipment setup\n- [ ] Meet the team\n\n## First Week\n- [ ] Security training\n- [ ] Dev environment\n- [ ] Team standups', 'HR', 2, p_james),
  (ws, 'Remote Work Policy', E'# Remote Work Policy\n\n## Eligibility\nAll employees after onboarding.\n\n## Equipment\n- Laptop + peripherals\n- $500 annual stipend\n\n## Core Hours\n10 AM - 3 PM local time', 'General', 1, p_admin),
  (ws, 'Design System Guidelines', E'# Design System\n\n## Typography\n- Headings: Inter 600\n- Body: Inter 400\n\n## Colors\n| Token | Light | Dark |\n| --- | --- | --- |\n| Primary | Indigo 600 | Indigo 400 |', 'Design', 1, p_priya);

-- Tasks
INSERT INTO tasks (workspace_id, title, description, status, priority, creator_id, assignee_id) VALUES
  (ws, 'Set up CI/CD pipeline', 'Configure GitHub Actions for notification service.', 'IN_PROGRESS', 'HIGH', p_admin, p_lin),
  (ws, 'Review Q2 hiring plan', 'Approve headcount and budget.', 'TODO', 'HIGH', p_admin, p_james),
  (ws, 'Update API documentation', 'Document v2 endpoints.', 'REVIEW', 'MEDIUM', p_admin, p_marcus),
  (ws, 'Design dashboard wireframes', 'Analytics dashboard redesign.', 'IN_PROGRESS', 'MEDIUM', p_admin, p_priya),
  (ws, 'Implement SSO integration', 'SAML-based SSO for enterprise.', 'TODO', 'HIGH', p_admin, p_sarah),
  (ws, 'Conduct security audit', 'Quarterly production audit.', 'TODO', 'HIGH', p_admin, p_lin),
  (ws, 'Write developer onboarding guide', 'Getting-started guide for new hires.', 'DONE', 'LOW', p_admin, p_marcus),
  (ws, 'Plan team offsite', 'Quarterly team building event.', 'DONE', 'LOW', p_admin, p_james),
  (ws, 'Migrate database to Postgres', 'SQLite to Supabase Postgres.', 'TODO', 'MEDIUM', p_admin, p_lin),
  (ws, 'Create satisfaction survey', 'Quarterly employee survey.', 'IN_PROGRESS', 'MEDIUM', p_admin, p_james),
  (ws, 'Fix token refresh bug', 'Fails silently on mobile.', 'REVIEW', 'HIGH', p_admin, p_marcus),
  (ws, 'Design mobile navigation', 'Hamburger menu prototype.', 'DONE', 'MEDIUM', p_admin, p_priya);

-- Courses & Lessons
INSERT INTO courses (id, workspace_id, title, description, is_mandatory) VALUES
  (c1, ws, 'Welcome to Radia', 'Company, team, and tools overview.', TRUE),
  (c2, ws, 'Security & Compliance', 'Essential security practices.', TRUE),
  (c3, ws, 'Advanced Git Workflows', 'Branching, rebasing, CI/CD.', FALSE);

INSERT INTO lessons (course_id, title, content, sort_order, estimated_minutes) VALUES
  (c1, 'Company Overview', 'Mission, values, and history.', 1, 5),
  (c1, 'Team Structure', 'How teams are organized.', 2, 3),
  (c1, 'Tools & Access', 'Dev environment setup.', 3, 4),
  (c2, 'Data Security', 'Encryption and secure communication.', 1, 6),
  (c2, 'Compliance Basics', 'Regulatory requirements.', 2, 5),
  (c3, 'Branching Strategies', 'Git Flow, trunk-based dev.', 1, 8),
  (c3, 'Rebasing & Squashing', 'Clean commit history.', 2, 6),
  (c3, 'CI/CD Integration', 'Hooks, tests, deployment.', 3, 7);

-- Enrollments
INSERT INTO course_enrollments (profile_id, course_id, completed_lessons, completed_at) VALUES
  (p_admin, c1, '[1,2,3]', NOW()-INTERVAL '170 days'), (p_admin, c2, '[1,2]', NOW()-INTERVAL '165 days'),
  (p_sarah, c1, '[1,2,3]', NOW()-INTERVAL '140 days'), (p_sarah, c2, '[1,2]', NOW()-INTERVAL '135 days'),
  (p_sarah, c3, '[1,2,3]', NOW()-INTERVAL '100 days'),
  (p_marcus, c1, '[1,2,3]', NOW()-INTERVAL '110 days'), (p_marcus, c2, '[1,2]', NOW()-INTERVAL '105 days'),
  (p_marcus, c3, '[1,2,3]', NOW()-INTERVAL '80 days'),
  (p_priya, c1, '[1,2,3]', NOW()-INTERVAL '25 days'), (p_priya, c2, '[1]', NULL),
  (p_james, c1, '[1,2,3]', NOW()-INTERVAL '85 days'), (p_james, c2, '[1,2]', NOW()-INTERVAL '80 days'),
  (p_lin, c1, '[1]', NULL), (p_lin, c2, '[]', NULL);

-- Skills
INSERT INTO skills (id, workspace_id, name, category) VALUES
  (sk_js,ws,'JavaScript','Engineering'),(sk_ts,ws,'TypeScript','Engineering'),
  (sk_react,ws,'React','Engineering'),(sk_node,ws,'Node.js','Engineering'),
  (sk_py,ws,'Python','Engineering'),(sk_devops,ws,'DevOps','Engineering'),
  (sk_sql,ws,'SQL','Engineering'),(sk_git,ws,'Git','Engineering'),
  (sk_ui,ws,'UI Design','Design'),(sk_ux,ws,'UX Research','Design'),(sk_figma,ws,'Figma','Design'),
  (sk_recruit,ws,'Recruiting','HR'),(sk_perf,ws,'Performance Management','HR'),(sk_er,ws,'Employee Relations','HR'),
  (sk_lead,ws,'Leadership','General'),(sk_comm,ws,'Communication','General'),(sk_pm,ws,'Project Management','General');

INSERT INTO course_skills (course_id, skill_id) VALUES (c1,sk_comm),(c2,sk_devops),(c3,sk_git);

INSERT INTO profile_skills (profile_id, skill_id, proficiency, source, verified_at) VALUES
  (p_admin,sk_ts,'expert','manual',NOW()),(p_admin,sk_react,'expert','manual',NOW()),
  (p_admin,sk_lead,'advanced','manual',NOW()),(p_admin,sk_comm,'intermediate','certification',NOW()),
  (p_sarah,sk_js,'expert','manual',NOW()),(p_sarah,sk_react,'advanced','manual',NOW()),
  (p_sarah,sk_lead,'expert','manual',NOW()),(p_sarah,sk_pm,'advanced','manual',NOW()),
  (p_sarah,sk_git,'advanced','certification',NOW()),
  (p_marcus,sk_js,'advanced','manual',NOW()),(p_marcus,sk_ts,'advanced','manual',NOW()),
  (p_marcus,sk_node,'intermediate','manual',NOW()),(p_marcus,sk_git,'advanced','certification',NOW()),
  (p_marcus,sk_sql,'intermediate','manual',NOW()),
  (p_priya,sk_ui,'advanced','manual',NOW()),(p_priya,sk_ux,'intermediate','manual',NOW()),
  (p_priya,sk_figma,'expert','manual',NOW()),(p_priya,sk_comm,'intermediate','certification',NOW()),
  (p_james,sk_recruit,'expert','manual',NOW()),(p_james,sk_perf,'advanced','manual',NOW()),
  (p_james,sk_er,'advanced','manual',NOW()),(p_james,sk_comm,'advanced','certification',NOW()),
  (p_lin,sk_devops,'intermediate','manual',NOW()),(p_lin,sk_py,'intermediate','manual',NOW()),
  (p_lin,sk_sql,'beginner','manual',NOW());

-- Certifications
INSERT INTO certifications (profile_id, course_id, skill_id, issued_at) VALUES
  (p_admin,c1,sk_comm,NOW()-INTERVAL '170 days'),(p_admin,c2,sk_devops,NOW()-INTERVAL '165 days'),
  (p_sarah,c1,sk_comm,NOW()-INTERVAL '140 days'),(p_sarah,c2,sk_devops,NOW()-INTERVAL '135 days'),
  (p_sarah,c3,sk_git,NOW()-INTERVAL '100 days'),
  (p_marcus,c1,sk_comm,NOW()-INTERVAL '110 days'),(p_marcus,c2,sk_devops,NOW()-INTERVAL '105 days'),
  (p_marcus,c3,sk_git,NOW()-INTERVAL '80 days'),
  (p_priya,c1,sk_comm,NOW()-INTERVAL '25 days'),
  (p_james,c1,sk_comm,NOW()-INTERVAL '85 days'),(p_james,c2,sk_devops,NOW()-INTERVAL '80 days');

-- Review cycles + reviews
INSERT INTO review_cycles (id, workspace_id, name, quarter, start_date, end_date, status) VALUES
  (cy1, ws, 'Q1 2026 Performance Review', 'Q1', '2026-01-01', '2026-03-31', 'completed'),
  (cy2, ws, 'Q2 2026 Performance Review', 'Q2', '2026-04-01', '2026-06-30', 'active');

INSERT INTO reviews (review_cycle_id, reviewee_id, reviewer_id, rating, summary, strengths, improvements, status, submitted_at) VALUES
  (cy1,p_sarah,p_admin,5,'Exceptional leadership.','Strategic thinking, mentorship','Delegate more','submitted',NOW()-INTERVAL '65 days'),
  (cy1,p_marcus,p_sarah,4,'Solid code quality.','Clean code, testing','More architecture work','submitted',NOW()-INTERVAL '63 days'),
  (cy1,p_james,p_admin,4,'Streamlined hiring.','Process improvement','Cross-dept collaboration','submitted',NOW()-INTERVAL '64 days'),
  (cy2,p_marcus,p_sarah,NULL,NULL,NULL,NULL,'pending',NULL),
  (cy2,p_priya,p_sarah,NULL,NULL,NULL,NULL,'pending',NULL),
  (cy2,p_lin,p_sarah,NULL,NULL,NULL,NULL,'pending',NULL),
  (cy2,p_sarah,p_admin,5,'Outstanding quarter.','Architecture leadership','Keep growing team','submitted',NOW()-INTERVAL '3 days'),
  (cy2,p_james,p_admin,NULL,NULL,NULL,NULL,'in_progress',NULL);

-- OKRs
INSERT INTO objectives (workspace_id, profile_id, review_cycle_id, title, metric, target_value, current_value, status) VALUES
  (ws,p_admin,cy2,'Ship v2.0 by Q2','Milestones',10,7,'on_track'),
  (ws,p_sarah,cy2,'Reduce deploy failures 50%','Failure rate',50,35,'on_track'),
  (ws,p_marcus,cy2,'Close 20 PRs/month','PRs/month',20,18,'on_track'),
  (ws,p_priya,cy2,'Complete design system v2','Components',40,15,'at_risk'),
  (ws,p_james,cy2,'Hire 5 engineers','Hires',5,3,'on_track'),
  (ws,p_lin,cy2,'Achieve 99.9% uptime','Uptime %',99.9,99.7,'at_risk'),
  (ws,p_marcus,cy1,'Deliver notification service','Features',8,8,'completed');

-- Audit log
INSERT INTO audit_log (workspace_id, actor_id, action, metadata, created_at) VALUES
  (ws,p_admin,'workspace_created','{"name":"Radia Corp"}'::jsonb,NOW()-INTERVAL '180 days'),
  (ws,p_admin,'profile_created','{"email":"sarah@radiacorp.com"}'::jsonb,NOW()-INTERVAL '150 days'),
  (ws,p_admin,'profile_created','{"email":"marcus@radiacorp.com"}'::jsonb,NOW()-INTERVAL '120 days'),
  (ws,p_admin,'review_cycle_created','{"name":"Q1 2026"}'::jsonb,NOW()-INTERVAL '90 days'),
  (ws,p_admin,'review_cycle_completed','{"name":"Q1 2026"}'::jsonb,NOW()-INTERVAL '60 days'),
  (ws,p_admin,'review_cycle_created','{"name":"Q2 2026"}'::jsonb,NOW()-INTERVAL '10 days');

-- Pending invite
INSERT INTO invites (workspace_id, email, token, role, invited_by, expires_at) VALUES
  (ws, 'alex@radiacorp.com', 'demo-invite-token', 'user', p_admin, NOW()+INTERVAL '7 days');

END $$;
