import { Profile, Task, Course, Lesson, CourseEnrollment, SOP, Integration, AdminRequest, ServerAdmin } from './types';

export const currentUser: Profile = {
  id: 'u1',
  workspace_id: 'w1',
  email: 'alex.rivera@radiacorp.com',
  first_name: 'Alex',
  last_name: 'Rivera',
  role: 'creator',
  title: 'CEO & Founder',
  manager_id: null,
  onboarding_completed: true,
  started_date: '2024-01-15',
  created_at: '2024-01-15T00:00:00Z',
  avatar_url: '',
};

export const profiles: Profile[] = [
  currentUser,
  {
    id: 'u2', workspace_id: 'w1', email: 'sarah.chen@radiacorp.com',
    first_name: 'Sarah', last_name: 'Chen', role: 'moderator',
    title: 'HR Director', manager_id: 'u1', onboarding_completed: true,
    started_date: '2024-02-01', created_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'u3', workspace_id: 'w1', email: 'marcus.johnson@radiacorp.com',
    first_name: 'Marcus', last_name: 'Johnson', role: 'moderator',
    title: 'Engineering Lead', manager_id: 'u1', onboarding_completed: true,
    started_date: '2024-02-15', created_at: '2024-02-15T00:00:00Z',
  },
  {
    id: 'u4', workspace_id: 'w1', email: 'emily.park@radiacorp.com',
    first_name: 'Emily', last_name: 'Park', role: 'moderator',
    title: 'Design Lead', manager_id: 'u1', onboarding_completed: true,
    started_date: '2024-03-01', created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'u5', workspace_id: 'w1', email: 'james.wilson@radiacorp.com',
    first_name: 'James', last_name: 'Wilson', role: 'user',
    title: 'Senior Engineer', manager_id: 'u3', onboarding_completed: true,
    started_date: '2024-03-15', created_at: '2024-03-15T00:00:00Z',
  },
  {
    id: 'u6', workspace_id: 'w1', email: 'lisa.nguyen@radiacorp.com',
    first_name: 'Lisa', last_name: 'Nguyen', role: 'user',
    title: 'Frontend Developer', manager_id: 'u3', onboarding_completed: false,
    started_date: '2024-06-01', created_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 'u7', workspace_id: 'w1', email: 'david.kim@radiacorp.com',
    first_name: 'David', last_name: 'Kim', role: 'user',
    title: 'UI/UX Designer', manager_id: 'u4', onboarding_completed: false,
    started_date: '2024-06-10', created_at: '2024-06-10T00:00:00Z',
  },
  {
    id: 'u8', workspace_id: 'w1', email: 'rachel.garcia@radiacorp.com',
    first_name: 'Rachel', last_name: 'Garcia', role: 'user',
    title: 'Backend Engineer', manager_id: 'u3', onboarding_completed: true,
    started_date: '2024-04-01', created_at: '2024-04-01T00:00:00Z',
  },
  {
    id: 'u9', workspace_id: 'w1', email: 'tom.baker@radiacorp.com',
    first_name: 'Tom', last_name: 'Baker', role: 'moderator',
    title: 'Marketing Lead', manager_id: 'u1', onboarding_completed: true,
    started_date: '2024-02-20', created_at: '2024-02-20T00:00:00Z',
  },
  {
    id: 'u10', workspace_id: 'w1', email: 'anna.lee@radiacorp.com',
    first_name: 'Anna', last_name: 'Lee', role: 'user',
    title: 'Content Strategist', manager_id: 'u9', onboarding_completed: true,
    started_date: '2024-05-01', created_at: '2024-05-01T00:00:00Z',
  },
];

export const tasks: Task[] = [
  {
    id: 't1', workspace_id: 'w1', title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated deployment to DigitalOcean',
    status: 'DONE', priority: 'HIGH', creator_id: 'u1', assignee_id: 'u3',
    assignee: profiles[2], due_date: '2024-07-15T00:00:00Z',
    created_at: '2024-07-01T00:00:00Z', updated_at: '2024-07-14T00:00:00Z',
    integration_source: 'github',
  },
  {
    id: 't2', workspace_id: 'w1', title: 'Design onboarding flow wireframes',
    description: 'Create Figma wireframes for the new employee onboarding experience',
    status: 'REVIEW', priority: 'HIGH', creator_id: 'u2', assignee_id: 'u4',
    assignee: profiles[3], due_date: '2024-07-20T00:00:00Z',
    created_at: '2024-07-05T00:00:00Z', updated_at: '2024-07-18T00:00:00Z',
  },
  {
    id: 't3', workspace_id: 'w1', title: 'Write company values SOP',
    description: 'Document core company values and culture guidelines for the knowledge base',
    status: 'IN_PROGRESS', priority: 'MEDIUM', creator_id: 'u2', assignee_id: 'u2',
    assignee: profiles[1], due_date: '2024-07-25T00:00:00Z',
    created_at: '2024-07-10T00:00:00Z', updated_at: '2024-07-16T00:00:00Z',
  },
  {
    id: 't4', workspace_id: 'w1', title: 'Implement Slack webhook integration',
    description: 'Build the API route handler for receiving Slack event callbacks',
    status: 'TODO', priority: 'MEDIUM', creator_id: 'u3', assignee_id: 'u5',
    assignee: profiles[4], due_date: '2024-07-30T00:00:00Z',
    created_at: '2024-07-12T00:00:00Z', updated_at: '2024-07-12T00:00:00Z',
    integration_source: 'slack',
  },
  {
    id: 't5', workspace_id: 'w1', title: 'Complete security audit checklist',
    description: 'Review RLS policies and ensure all endpoints have proper auth guards',
    status: 'TODO', priority: 'HIGH', creator_id: 'u1', assignee_id: 'u8',
    assignee: profiles[7], due_date: '2024-08-01T00:00:00Z',
    created_at: '2024-07-15T00:00:00Z', updated_at: '2024-07-15T00:00:00Z',
  },
  {
    id: 't6', workspace_id: 'w1', title: 'Create marketing launch page',
    description: 'Build a landing page for the Radia product launch announcement',
    status: 'IN_PROGRESS', priority: 'LOW', creator_id: 'u9', assignee_id: 'u10',
    assignee: profiles[9], due_date: '2024-08-05T00:00:00Z',
    created_at: '2024-07-16T00:00:00Z', updated_at: '2024-07-17T00:00:00Z',
  },
  {
    id: 't7', workspace_id: 'w1', title: 'Setup GitHub webhook receiver',
    description: 'Create /api/integrations/github/webhook route handler',
    status: 'REVIEW', priority: 'MEDIUM', creator_id: 'u3', assignee_id: 'u5',
    assignee: profiles[4], due_date: '2024-07-22T00:00:00Z',
    created_at: '2024-07-08T00:00:00Z', updated_at: '2024-07-20T00:00:00Z',
    integration_source: 'github',
  },
  {
    id: 't8', workspace_id: 'w1', title: 'Onboard Lisa Nguyen',
    description: 'Assign mandatory courses and verify document uploads for new hire',
    status: 'IN_PROGRESS', priority: 'HIGH', creator_id: 'u2', assignee_id: 'u6',
    assignee: profiles[5], due_date: '2024-07-18T00:00:00Z',
    created_at: '2024-07-01T00:00:00Z', updated_at: '2024-07-15T00:00:00Z',
  },
  {
    id: 't9', workspace_id: 'w1', title: 'Brand guidelines document',
    description: 'Finalize brand colors, fonts, and logo usage guidelines',
    status: 'DONE', priority: 'MEDIUM', creator_id: 'u4', assignee_id: 'u7',
    assignee: profiles[6], due_date: '2024-07-10T00:00:00Z',
    created_at: '2024-06-25T00:00:00Z', updated_at: '2024-07-10T00:00:00Z',
  },
  {
    id: 't10', workspace_id: 'w1', title: 'Configure Discord notifications',
    description: 'Set up Discord bot for onboarding milestone notifications',
    status: 'TODO', priority: 'LOW', creator_id: 'u3', assignee_id: 'u5',
    assignee: profiles[4], due_date: '2024-08-10T00:00:00Z',
    created_at: '2024-07-18T00:00:00Z', updated_at: '2024-07-18T00:00:00Z',
    integration_source: 'discord',
  },
];

const lessonContents = `## Welcome to Radia

This lesson covers the fundamentals of our platform and how we work together as a team.

> [!info] This is a **mandatory** lesson for all new hires. Make sure to read it carefully.

### Key Points
- Always follow the standard operating procedures
- Communication is key — use **Slack** for quick questions, email for formal requests
- Document everything in the knowledge base
- Review the [Employee Handbook](https://docs.google.com/document/d/example) before your first week

### Our Culture
> We believe in transparency, collaboration, and continuous improvement. Every voice matters.

### Tools We Use

| Tool | Purpose |
|------|---------|
| Slack | Daily communication |
| GitHub | Code collaboration |
| Figma | Design work |
| Notion | Documentation |

\`\`\`bash
# Quick start: join our Slack workspace
open https://radiacorp.slack.com/join
\`\`\`

> [!tip] Bookmark the **#general** and **#engineering** Slack channels on your first day.

### Next Steps
- [x] Read this welcome guide
- [ ] Set up your workstation
- [ ] Join Slack channels
- [ ] Complete the remaining onboarding lessons`;

export const courses: Course[] = [
  {
    id: 'c1', workspace_id: 'w1', title: 'Company Orientation',
    description: 'Learn about Radia Corp culture, values, and how we operate day-to-day.',
    is_mandatory: true, created_at: '2024-01-20T00:00:00Z',
    lessons: [
      { id: 'l1', course_id: 'c1', title: 'Welcome to Radia', content: lessonContents, sort_order: 1, estimated_minutes: 15 },
      { id: 'l2', course_id: 'c1', title: 'Our Mission & Values', content: `## Our Mission & Values

At Radia, our mission is simple: **build tools that help teams thrive**.

### Core Values

1. **Transparency** — We share context openly so everyone can make informed decisions
2. **Collaboration** — Great products are built by diverse teams working together
3. **Continuous Improvement** — We iterate fast, learn from mistakes, and celebrate progress
4. **Empathy** — We design for real humans and treat each other with respect

> [!info] These values guide every decision we make — from product design to hiring.

### The Radia Way

> "We don't just build software. We build the environment where great work happens."
> — Alex Rivera, CEO & Founder

### Living Our Values

- When in doubt, **over-communicate** rather than under-communicate
- Give feedback that is *kind*, *specific*, and *actionable*
- Celebrate wins — big and small
- Own your mistakes and share learnings with the team

> [!tip] Pin the **#values-in-action** Slack channel to see real examples of our values at work.

---

### Knowledge Check
- [ ] I understand Radia's core mission
- [ ] I can name at least 3 core values
- [ ] I know where to find the values channel on Slack`, sort_order: 2, estimated_minutes: 10 },
      { id: 'l3', course_id: 'c1', title: 'Team Structure', content: `## Team Structure

Understanding how teams are organized at Radia will help you collaborate effectively.

### Organization Overview

Our org structure is **flat by design** — minimal hierarchy, maximum autonomy.

- **Alex Rivera** — CEO & Founder
  - **Sarah Chen** — HR Director
  - **Marcus Johnson** — Engineering Lead
    - James Wilson, Lisa Nguyen, Rachel Garcia
  - **Emily Park** — Design Lead
    - David Kim
  - **Tom Baker** — Marketing Lead
    - Anna Lee

### How Teams Work

Each team has a **lead** who is responsible for:
1. Setting quarterly goals aligned with company OKRs
2. Running weekly standups and retrospectives
3. Supporting team members' growth and development
4. Coordinating cross-team projects

> [!info] You can view the full org chart anytime from the **Org Chart** page in the sidebar.

### Cross-Team Collaboration

We use a **squad model** for large initiatives:
- Squads are temporary, cross-functional teams
- Each squad has an engineering lead, designer, and PM
- Squads dissolve after the initiative ships

\`\`\`
Squad Structure:
├── Engineering Lead (drives technical decisions)
├── Designer (owns UX and visual design)
├── PM / Stakeholder (sets goals and priorities)
└── Contributors (specialists as needed)
\`\`\`

> [!tip] Check the **#squads** channel on Slack to see active squads and join one!`, sort_order: 3, estimated_minutes: 10 },
      { id: 'l4', course_id: 'c1', title: 'Communication Channels', content: `## Communication Channels

Effective communication is the backbone of remote-first work. Here's how we stay connected.

### Channel Guide

**Slack** — Real-time messaging
- \`#general\` — Company-wide announcements
- \`#engineering\` — Technical discussions
- \`#design\` — Design feedback and reviews
- \`#random\` — Watercooler chat
- \`#incidents\` — Production issues (urgent)

**Email** — Formal communications
- HR paperwork and official requests
- External client communication
- Legal and compliance matters

**GitHub** — Code collaboration
- Pull requests and code reviews
- Issue tracking and project boards
- Technical documentation

> [!warning] Never share sensitive information (passwords, API keys, personal data) in Slack channels. Use 1Password or direct encrypted channels.

### Response Time Expectations

| Channel | Expected Response |
|---------|------------------|
| Slack DM | Within 2 hours |
| Slack channel | Within 4 hours |
| Email | Within 24 hours |
| GitHub PR review | Within 1 business day |
| \`#incidents\` | Immediate (if on-call) |

### Meeting Etiquette

- **Camera on** for team meetings (optional for all-hands)
- **Mute when not speaking** in large meetings
- Share an **agenda** at least 1 hour before the meeting
- End meetings with clear **action items** and owners

> [!tip] Use Slack's **/remind** command to set follow-up reminders after meetings.

---

### Quick Check
- [ ] I've joined the required Slack channels
- [ ] I understand response time expectations
- [ ] I know when to use Slack vs Email vs GitHub`, sort_order: 4, estimated_minutes: 8 },
    ],
  },
  {
    id: 'c2', workspace_id: 'w1', title: 'Engineering Onboarding',
    description: 'Set up your development environment, learn our coding standards, and make your first PR.',
    is_mandatory: true, created_at: '2024-02-01T00:00:00Z',
    lessons: [
      { id: 'l5', course_id: 'c2', title: 'Dev Environment Setup', content: `## Dev Environment Setup

Get your local development environment up and running in under 30 minutes.

### Prerequisites

- **Node.js 20+** (we recommend using \`nvm\`)
- **Git** configured with your GitHub SSH key
- **VS Code** with our recommended extensions

> [!info] Ask your team lead for access to the GitHub organization if you haven't received an invite yet.

### Step-by-Step Setup

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run the development server

\`\`\`bash
# 1. Clone the repo
git clone git@github.com:radiacorp/radia.git
cd radia

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start the dev server
npm run dev
\`\`\`

### VS Code Extensions

Install these recommended extensions:
- **ESLint** — Linting and code quality
- **Tailwind CSS IntelliSense** — Autocomplete for Tailwind classes
- **Prettier** — Code formatting
- **GitLens** — Git blame and history

> [!tip] Run \`code --install-extension\` from the terminal to install extensions quickly.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Kill the process: \`lsof -ti:3000 | xargs kill\` |
| Module not found | Delete \`node_modules\` and run \`npm install\` |
| Env vars missing | Check \`.env.local\` matches \`.env.local.example\` |

---

- [ ] Repository cloned and dependencies installed
- [ ] Dev server running on localhost:3000
- [ ] VS Code extensions installed`, sort_order: 1, estimated_minutes: 30 },
      { id: 'l6', course_id: 'c2', title: 'Code Review Process', content: `## Code Review Process

All code changes go through peer review. Here's how we do it at Radia.

### Branch Naming Convention

\`\`\`
feature/TICKET-123-short-description
bugfix/TICKET-456-fix-login-redirect
hotfix/critical-auth-bypass
\`\`\`

### PR Requirements

Every pull request **must**:
1. Have a clear title following [Conventional Commits](https://www.conventionalcommits.org)
2. Include a description explaining **what** and **why**
3. Pass all CI checks (lint, type-check, tests)
4. Receive at least **1 approval** from a team member

> [!warning] Never merge your own PR without at least one review. Emergency hotfixes require post-merge review within 24 hours.

### Commit Message Format

\`\`\`
feat: add user avatar upload to settings
fix: resolve race condition in task drag-and-drop
docs: update onboarding checklist for new engineers
chore: bump Next.js to 16.2.6
\`\`\`

### Review Etiquette

- Be **constructive** — suggest alternatives, don't just criticize
- Use *"nit:"* prefix for non-blocking style suggestions
- Approve if the code is **good enough**, not perfect
- Respond to review comments within **1 business day**

> [!tip] Use GitHub's **Suggested Changes** feature to propose exact code edits in your reviews.`, sort_order: 2, estimated_minutes: 15 },
      { id: 'l7', course_id: 'c2', title: 'Deployment Pipeline', content: `## Deployment Pipeline

We use a fully automated CI/CD pipeline for safe, fast deployments.

### Pipeline Overview

\`\`\`
Push to branch → CI checks → PR review → Merge to main → Auto-deploy
\`\`\`

### Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Development | feature/* | localhost:3000 | Local development |
| Staging | main | staging.radia.app | Pre-production testing |
| Production | release/* | app.radia.app | Live environment |

### CI Checks (GitHub Actions)

Every push triggers:
1. **Linting** — ESLint checks for code quality
2. **Type checking** — TypeScript compiler validation
3. **Unit tests** — Jest test suite
4. **Build** — Next.js production build verification

> [!info] CI runs take approximately 3-5 minutes. You can monitor progress in the GitHub Actions tab.

### Deployment Process

1. Merge your PR into \`main\`
2. Staging deployment happens **automatically**
3. Verify changes on staging
4. Create a release PR from \`main\` to \`release/production\`
5. Production deploys after release PR is merged

> [!warning] **Never** force push to \`main\` or \`release/*\` branches. These are protected branches.

### Rollback Procedure

If something goes wrong in production:
1. Alert the team in \`#incidents\`
2. Revert the problematic commit
3. Push the revert to trigger an automatic rollback
4. Write a post-mortem within 48 hours

---

- [ ] I understand the branching strategy
- [ ] I know how deployments are triggered
- [ ] I know the rollback procedure`, sort_order: 3, estimated_minutes: 20 },
    ],
  },
  {
    id: 'c3', workspace_id: 'w1', title: 'Security & Compliance',
    description: 'Mandatory security awareness training covering data handling, access controls, and incident response.',
    is_mandatory: true, created_at: '2024-03-01T00:00:00Z',
    lessons: [
      { id: 'l8', course_id: 'c3', title: 'Data Classification', content: `## Data Classification

Understanding how we classify data is critical for compliance and security.

### Classification Levels

| Level | Label | Examples | Handling |
|-------|-------|----------|----------|
| 1 | **Public** | Marketing content, blog posts | No restrictions |
| 2 | **Internal** | SOPs, team docs, Slack messages | Radia employees only |
| 3 | **Confidential** | Employee PII, financial data | Need-to-know basis |
| 4 | **Restricted** | API keys, passwords, tokens | Encrypted, 1Password only |

> [!warning] Sharing **Confidential** or **Restricted** data outside approved channels is a serious policy violation and may result in disciplinary action.

### Data Handling Rules

- **Never** store passwords or API keys in code repositories
- Use \`1Password\` for all credential storage and sharing
- Encrypt sensitive data at rest and in transit
- Delete data you no longer need — don't hoard

\`\`\`bash
# WRONG - never do this
export DATABASE_URL="postgres://user:password@host/db"

# RIGHT - use environment variables
export DATABASE_URL=$SUPABASE_DB_URL
\`\`\`

> [!tip] When in doubt about data classification, treat it as **Confidential** and ask your team lead.

### Reporting Data Incidents

If you suspect a data breach or mishandling:
1. Immediately report to \`#incidents\` on Slack
2. Do **not** attempt to fix it yourself
3. Document what you observed
4. Follow up with the security team

---

- [ ] I understand the 4 data classification levels
- [ ] I know where to store credentials safely
- [ ] I know how to report a data incident`, sort_order: 1, estimated_minutes: 12 },
      { id: 'l9', course_id: 'c3', title: 'Access Control Policies', content: `## Access Control Policies

We use **Role-Based Access Control (RBAC)** to manage permissions across the platform.

### Workspace Roles

| Role | Permissions |
|------|-------------|
| **Creator** | Full workspace admin — manage members, settings, billing |
| **Moderator** | Manage tasks, SOPs, courses, integrations |
| **User** | View and interact with assigned content |

### Server-Level Roles

These are separate from workspace roles and grant infrastructure access:

- **Super Admin** — Full platform access, infrastructure management
- **DevOps** — CI/CD pipelines, server logs, deployment management
- **Auditor** — Read-only access to audit trails and compliance data

> [!info] Server-level roles must be requested through the **Admin Panel** and approved by a Super Admin.

### Principle of Least Privilege

- Only request access you **actually need**
- Access is reviewed **quarterly** and revoked if unused
- Temporary elevated access expires after **24 hours**
- All access changes are logged in the audit trail

### Row-Level Security (RLS)

Our database uses Supabase RLS policies:

\`\`\`sql
-- Example: Users can only read their own workspace data
create policy "workspace_members_read" on profiles
  for select using (
    workspace_id in (
      select workspace_id from profiles
      where auth_user_id = auth.uid()
    )
  );
\`\`\`

> [!warning] Never disable RLS policies, even in development. Use the service role key only in server-side code.

---

- [ ] I understand the workspace role hierarchy
- [ ] I know how to request server-level access
- [ ] I understand the principle of least privilege`, sort_order: 2, estimated_minutes: 15 },
    ],
  },
  {
    id: 'c4', workspace_id: 'w1', title: 'Design System Guide',
    description: 'Learn our visual design language, component library usage, and brand guidelines.',
    is_mandatory: false, created_at: '2024-04-01T00:00:00Z',
    lessons: [
      { id: 'l10', course_id: 'c4', title: 'Brand Identity', content: `## Radia Brand Identity

Our visual identity reflects our values: **modern**, **clean**, and **approachable**.

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Radia Indigo** | \`#4F46E5\` | Primary actions, links, active states |
| **Teal** | \`#0D9488\` | Secondary accents, success states |
| **Violet** | \`#7C3AED\` | Highlights, premium features |
| **Slate** | \`#0F172A → #F8FAFC\` | Backgrounds, text, borders |

### Typography

- **Headings** — Geist Sans Bold
- **Body text** — Geist Sans Regular
- **Code** — Geist Mono

> [!info] Always use our font stack. Never substitute with Arial, Helvetica, or system fonts in customer-facing materials.

### Logo Usage

- Maintain **clear space** around the logo equal to the height of the "R"
- Minimum size: **24px** height for digital, **10mm** for print
- Use the **dark logo** on light backgrounds and vice versa
- **Never** stretch, rotate, or add effects to the logo

> [!warning] The logo files are in the \`/brand\` folder on Google Drive. Do not recreate or modify them.

### Photography & Illustration

- Use **authentic** imagery — no stock photos with forced smiles
- Illustrations should follow our **line art** style
- Maintain a **warm, inclusive** tone in all visual content

---

- [ ] I know the primary brand colors
- [ ] I understand logo usage guidelines
- [ ] I know where to find brand assets`, sort_order: 1, estimated_minutes: 10 },
      { id: 'l11', course_id: 'c4', title: 'Component Library', content: `## Component Library

We use **shadcn/ui** as our component foundation with custom Radia styling on top.

### Architecture

\`\`\`
src/components/
├── ui/           ← shadcn base components (button, card, dialog...)
├── layout/       ← Sidebar, navigation, page wrappers
├── dashboard/    ← Dashboard-specific components
├── tasks/        ← Task management components
└── ...           ← Feature-specific directories
\`\`\`

### Custom Radia Components

We extend shadcn with these custom styles:

\`\`\`css
/* Glassmorphic card */
.radia-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

/* Input fields */
.radia-input {
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
\`\`\`

### Design Tokens

We use CSS custom properties for theming:

- \`--background\` — Page background
- \`--foreground\` — Primary text color
- \`--card\` / \`--card-foreground\` — Card surfaces
- \`--primary\` / \`--primary-foreground\` — Action colors
- \`--muted\` / \`--muted-foreground\` — Subtle elements

> [!tip] Use the \`cn()\` utility from \`@/lib/utils\` to safely merge Tailwind classes.

### Accessibility Standards

- All interactive elements must be **keyboard accessible**
- Color contrast must meet **WCAG AA** (4.5:1 for normal text)
- Use semantic HTML (\`<button>\`, \`<nav>\`, \`<main>\`)
- Provide \`aria-label\` for icon-only buttons

---

- [ ] I understand the component file structure
- [ ] I know how to use Radia design tokens
- [ ] I understand our accessibility requirements`, sort_order: 2, estimated_minutes: 20 },
    ],
  },
];

export const enrollments: CourseEnrollment[] = [
  { id: 'e1', profile_id: 'u6', course_id: 'c1', completed_lessons: [1, 2] },
  { id: 'e2', profile_id: 'u6', course_id: 'c2', completed_lessons: [1] },
  { id: 'e3', profile_id: 'u6', course_id: 'c3', completed_lessons: [] },
  { id: 'e4', profile_id: 'u7', course_id: 'c1', completed_lessons: [1, 2, 3] },
  { id: 'e5', profile_id: 'u7', course_id: 'c4', completed_lessons: [1] },
];

export const sops: SOP[] = [
  {
    id: 's1', workspace_id: 'w1', title: 'Employee Handbook',
    content: `# Employee Handbook

## 1. Introduction

Welcome to **Radia Corp**. This handbook outlines our policies, procedures, and expectations for all team members.

> [!info] This handbook is reviewed quarterly. Always refer to the latest version on this page.

## 2. Working Hours

We operate on a **flexible schedule**. Core hours are **10 AM - 4 PM** in your local timezone. You are expected to be available for meetings and collaboration during these hours.

| Schedule Type | Hours | Notes |
|---------------|-------|-------|
| Core hours | 10 AM - 4 PM | Must be available |
| Flexible hours | Outside core | Work when productive |
| Meetings | As scheduled | Camera on preferred |

## 3. Communication

- **Slack** for real-time messaging
- **Email** for formal communications
- **GitHub** for code reviews and technical discussions

> [!warning] Never share confidential company information in public Slack channels.

## 4. Time Off

All employees receive **20 days PTO** per year plus public holidays. Submit requests through the HR portal at least 2 weeks in advance.

### PTO Request Process:
1. Check with your team lead for coverage
2. Submit request in the HR portal
3. Wait for approval (usually within 48 hours)
4. Update your Slack status and calendar

## 5. Code of Conduct

We maintain a **respectful, inclusive** workplace. Harassment of any kind will not be tolerated.

> [!tip] If you witness or experience inappropriate behavior, report it immediately to HR or use the anonymous reporting form.

---

*Last updated by Sarah Chen — HR Director*`,
    category: 'General', version: 3, last_updated_by: 'u2',
    created_at: '2024-01-20T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 's2', workspace_id: 'w1', title: 'Git Workflow & Branching Strategy',
    content: `# Git Workflow & Branching Strategy

## Branch Naming

\`\`\`
feature/TICKET-123-description
bugfix/TICKET-456-description
hotfix/critical-issue
\`\`\`

## Process

1. Create branch from \`main\`
2. Make changes and commit
3. Push and create PR
4. Get at least **1 approval**
5. **Squash merge** into \`main\`

> [!warning] Never force push to \`main\` or \`release/*\` branches. These are protected.

## Commit Messages

Follow **conventional commits**:
- \`feat:\` — New feature
- \`fix:\` — Bug fix
- \`docs:\` — Documentation only
- \`chore:\` — Maintenance tasks
- \`refactor:\` — Code restructuring

\`\`\`bash
# Good examples
git commit -m "feat: add drag-and-drop to task board"
git commit -m "fix: resolve auth redirect loop on logout"
git commit -m "docs: update API endpoint documentation"
\`\`\`

> [!tip] Use \`git commit --amend\` to fix typos in your last commit message before pushing.

---

*Maintained by the Engineering team*`,
    category: 'Engineering', version: 2, last_updated_by: 'u3',
    created_at: '2024-02-10T00:00:00Z', updated_at: '2024-05-20T00:00:00Z',
  },
  {
    id: 's3', workspace_id: 'w1', title: 'Incident Response Procedure',
    content: `# Incident Response Procedure

## Severity Levels

| Level | Label | Description | Response Time |
|-------|-------|-------------|---------------|
| **P1** | Critical | System down, all users affected | **Immediate** |
| **P2** | Major | Core feature broken, workaround exists | Within 1 hour |
| **P3** | Minor | Non-critical bug, limited impact | Within 4 hours |

> [!warning] P1 incidents require **all-hands response**. Drop everything and join \`#incidents\`.

## Response Steps

1. **Acknowledge** the incident in \`#incidents\` Slack channel
2. **Assess** severity and assign an incident commander
3. **Investigate** root cause and communicate updates every 30 minutes
4. **Resolve** and deploy the fix
5. Write a **post-mortem** within 48 hours

### Post-Mortem Template

\`\`\`markdown
# Incident Post-Mortem: [Title]

**Date:** YYYY-MM-DD
**Severity:** P1/P2/P3
**Duration:** X hours
**Commander:** [Name]

## Summary
[Brief description of what happened]

## Timeline
- HH:MM — Incident detected
- HH:MM — Team assembled
- HH:MM — Root cause identified
- HH:MM — Fix deployed

## Root Cause
[Technical explanation]

## Action Items
- [ ] [Preventive measure 1]
- [ ] [Preventive measure 2]
\`\`\`

> [!tip] Blameless post-mortems lead to better outcomes. Focus on **systems**, not individuals.

---

*Maintained by the Engineering team*`,
    category: 'Engineering', version: 1, last_updated_by: 'u3',
    created_at: '2024-03-05T00:00:00Z', updated_at: '2024-03-05T00:00:00Z',
  },
  {
    id: 's4', workspace_id: 'w1', title: 'Brand Guidelines',
    content: `# Brand Guidelines

## Logo Usage

Always use the official Radia logo. Maintain **clear space** around the logo equal to the height of the "R".

> [!warning] Never stretch, rotate, recolor, or add effects to the logo. Only use official logo files.

## Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Primary Indigo** | \`#4F46E5\` | Buttons, links, active states |
| **Secondary Teal** | \`#0D9488\` | Success, secondary actions |
| **Accent Violet** | \`#7C3AED\` | Highlights, premium features |
| **Slate Dark** | \`#0F172A\` | Headings, dark mode bg |
| **Slate Light** | \`#F8FAFC\` | Light mode backgrounds |

## Typography

- **Headings** — Geist Sans Bold
- **Body** — Geist Sans Regular
- **Code** — Geist Mono

> [!tip] Use the \`font-mono\` class for any numerical data, code, or technical content.

## Voice & Tone

- **Clear** — No jargon, no ambiguity
- **Warm** — Friendly but professional
- **Concise** — Say more with fewer words
- **Inclusive** — Write for a global audience

---

*Maintained by the Design team*`,
    category: 'Design', version: 2, last_updated_by: 'u4',
    created_at: '2024-02-20T00:00:00Z', updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 's5', workspace_id: 'w1', title: 'Onboarding Checklist for New Hires',
    content: `# New Hire Onboarding Checklist

> [!info] Work through this checklist during your first month. Your manager and HR will check in regularly.

## Day 1

- [ ] Set up workstation and install required software
- [ ] Complete **Company Orientation** course
- [ ] Meet your team lead for a welcome 1:1
- [ ] Access Slack and email
- [ ] Join required Slack channels (\`#general\`, \`#your-team\`)

## Week 1

- [ ] Complete all **mandatory courses** in Onboarding
- [ ] Submit ID and tax forms to HR
- [ ] First 1:1 with your manager
- [ ] Set up your development environment (if engineering)
- [ ] Review relevant SOPs for your role

## Month 1

- [ ] Complete your first project milestone or deliverable
- [ ] Shadow a senior team member for one full day
- [ ] **30-day check-in** with HR
- [ ] Provide feedback on the onboarding experience

> [!tip] Don't hesitate to ask questions. Every new hire gets a **buddy** — reach out to them anytime!

---

*Maintained by the HR team*`,
    category: 'HR', version: 1, last_updated_by: 'u2',
    created_at: '2024-04-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z',
  },
];

export const integrations: Integration[] = [
  { id: 'i1', workspace_id: 'w1', platform_name: 'slack', is_active: true, created_at: '2024-02-01T00:00:00Z' },
  { id: 'i2', workspace_id: 'w1', platform_name: 'github', is_active: true, created_at: '2024-02-01T00:00:00Z' },
  { id: 'i3', workspace_id: 'w1', platform_name: 'gmail', is_active: true, created_at: '2024-03-01T00:00:00Z' },
  { id: 'i4', workspace_id: 'w1', platform_name: 'discord', is_active: false, created_at: '2024-04-01T00:00:00Z' },
  { id: 'i5', workspace_id: 'w1', platform_name: 'teams', is_active: false, created_at: '2024-04-01T00:00:00Z' },
  { id: 'i6', workspace_id: 'w1', platform_name: 'messenger', is_active: false, created_at: '2024-04-01T00:00:00Z' },
];

// Admin access requests (workspace creators can request server admin roles)
export const adminRequests: AdminRequest[] = [
  {
    id: 'ar1', profile_id: 'u1', requested_role: 'super_admin',
    status: 'approved', reason: 'Platform founder — need full infrastructure access.',
    created_at: '2024-01-15T00:00:00Z', reviewed_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'ar2', profile_id: 'u3', requested_role: 'devops',
    status: 'pending', reason: 'Need access to CI/CD pipelines and server logs for deployment management.',
    created_at: '2024-07-10T00:00:00Z',
  },
  {
    id: 'ar3', profile_id: 'u2', requested_role: 'auditor',
    status: 'rejected', reason: 'Want to review platform audit trails for compliance reporting.',
    created_at: '2024-06-20T00:00:00Z', reviewed_at: '2024-06-22T00:00:00Z', reviewed_by: 'u1',
  },
];

// Server admins (approved users with server-level access)
export const serverAdmins: ServerAdmin[] = [
  { id: 'sa1', profile_id: 'u1', server_role: 'super_admin', granted_at: '2024-01-15T00:00:00Z' },
];

export function getProfileById(id: string): Profile | undefined {
  return profiles.find(p => p.id === id);
}

export function getTasksByStatus(status: string): Task[] {
  return tasks.filter(t => t.status === status);
}

export function buildOrgTree(profilesList: Profile[]): Profile & { children: (Profile & { children: unknown[] })[] } {
  const root = profilesList.find(p => !p.manager_id);
  if (!root) throw new Error('No root profile found');

  function getChildren(parentId: string): (Profile & { children: unknown[] })[] {
    return profilesList
      .filter(p => p.manager_id === parentId)
      .map(p => ({ ...p, children: getChildren(p.id) }));
  }

  return { ...root, children: getChildren(root.id) };
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'creator': return 'Creator';
    case 'moderator': return 'Moderator';
    case 'user': return 'User';
    case 'super_admin': return 'Super Admin';
    case 'devops': return 'DevOps';
    case 'auditor': return 'Auditor';
    default: return role;
  }
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'creator': return 'bg-violet-500/20 text-violet-300';
    case 'moderator': return 'bg-blue-500/20 text-blue-300';
    case 'user': return 'bg-slate-500/20 text-slate-300';
    case 'super_admin': return 'bg-red-500/20 text-red-300';
    case 'devops': return 'bg-amber-500/20 text-amber-300';
    case 'auditor': return 'bg-teal-500/20 text-teal-300';
    default: return 'bg-slate-500/20 text-slate-300';
  }
}
