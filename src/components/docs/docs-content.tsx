"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Key,
  LayoutDashboard,
  LogIn,
  Menu,
  Moon,
  Network,
  Plug,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Target,
  UserPlus,
  Users,
  X,
  Rocket,
  CreditCard,
  Database,
  Mail,
  Globe,
} from "lucide-react";

/* ── Reusable doc atoms ──────────────────────────────── */

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{children}</h2>;
}
function H3({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h3 id={id} className="mb-2 mt-8 text-lg font-semibold text-slate-800 dark:text-slate-200">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</p>;
}
function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</ol>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</ul>;
}
function Img({ alt, src }: { alt: string; src?: string }) {
  if (src) {
    return (
      <figure className="my-4">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full rounded-xl border border-slate-200 shadow-sm dark:border-slate-700"
        />
        <figcaption className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">{alt}</figcaption>
      </figure>
    );
  }
  return (
    <div className="my-4 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 dark:border-slate-700 dark:bg-slate-900/50">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{alt}</p>
    </div>
  );
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <p className="text-sm text-indigo-800 dark:text-indigo-200">{children}</p>
    </div>
  );
}
function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
      <p className="text-sm text-amber-800 dark:text-amber-200">{children}</p>
    </div>
  );
}
function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{q}</p>
      <div className="text-sm text-slate-600 dark:text-slate-400">{children}</div>
    </div>
  );
}
function RoleBadge({ role }: { role: "creator" | "employee" | "both" }) {
  const styles = {
    creator: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    employee: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    both: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  };
  const labels = { creator: "Admin / Creator", employee: "Employee", both: "All Roles" };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[role]}`}>{labels[role]}</span>;
}

/* ── Section structure ───────────────────────────────── */

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "start" | "features" | "help" | "roadmap";
  content: () => React.ReactNode;
}

const sections: Section[] = [
  /* ═══════════════════════════════════════════════
     GETTING STARTED
     ═══════════════════════════════════════════════ */
  {
    id: "welcome",
    title: "What is Radia?",
    icon: BookOpen,
    group: "start",
    content: () => (
      <>
        <H2>Welcome to Radia</H2>
        <P>Radia is your team&apos;s all-in-one HR workspace. Instead of juggling separate tools for employee records, task tracking, onboarding, and performance reviews, Radia brings everything into a single place.</P>

        <H3>What can you do with Radia?</H3>
        <Ul>
          <li><strong>Manage your team</strong> &mdash; Keep employee profiles, org charts, and role assignments in one place</li>
          <li><strong>Track tasks</strong> &mdash; Assign, prioritize, and monitor work across your team with kanban boards, lists, or tables</li>
          <li><strong>Build a knowledge base</strong> &mdash; Create SOPs (Standard Operating Procedures) with a rich text editor so your team always has a reference</li>
          <li><strong>Onboard new hires</strong> &mdash; Design training courses with lessons, track completion, and auto-enroll new employees</li>
          <li><strong>Run performance reviews</strong> &mdash; Set up quarterly review cycles, write feedback, track OKRs, and identify skill gaps</li>
          <li><strong>Track skills &amp; certifications</strong> &mdash; See your team&apos;s skill matrix and auto-issue certifications when courses are completed</li>
          <li><strong>Connect your tools</strong> &mdash; Integrate with Slack, GitHub, Gmail, Discord, Teams, and Messenger</li>
        </Ul>

        <H3>Who uses Radia?</H3>
        <P>There are two main types of users:</P>
        <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-500/30 dark:bg-violet-500/10">
            <p className="mb-1 text-sm font-semibold text-violet-800 dark:text-violet-200">Workspace Creators &amp; Admins</p>
            <p className="text-xs leading-relaxed text-violet-700 dark:text-violet-300">You created the organization. You manage settings, invite team members, configure integrations, create courses, run reviews, and oversee everything.</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
            <p className="mb-1 text-sm font-semibold text-sky-800 dark:text-sky-200">Employees &amp; Team Members</p>
            <p className="text-xs leading-relaxed text-sky-700 dark:text-sky-300">You were invited to the workspace. You complete tasks, take onboarding courses, participate in reviews, and view the knowledge base.</p>
          </div>
        </div>
        <Tip>This guide covers both paths. Look for the role badges to quickly find what applies to you.</Tip>
      </>
    ),
  },
  {
    id: "creator-setup",
    title: "Creator: Getting Started",
    icon: UserPlus,
    group: "start",
    content: () => (
      <>
        <H2>Getting Started as a Workspace Creator</H2>
        <RoleBadge role="creator" />

        <H3>Step 1: Create Your Account</H3>
        <P>Go to the Radia homepage and click <strong>Get started</strong>.</P>
        <Ol>
          <li>Enter your <strong>first name</strong>, <strong>last name</strong>, <strong>email</strong>, and a <strong>password</strong> (at least 8 characters)</li>
          <li>Click <strong>Create account</strong></li>
        </Ol>
        <Img alt="Signup page" src="/docs/signup.png" />

        <H3>Step 2: Set Up Your Organization</H3>
        <P>After signing up, you&apos;ll land on the setup wizard.</P>
        <Ol>
          <li>Click <strong>Get Started</strong> on the welcome screen</li>
          <li>Choose <strong>Create an Organization</strong></li>
          <li>Enter your <strong>organization name</strong> (e.g., &quot;Acme Corp&quot;)</li>
          <li>Click <strong>Create Organization &amp; Subscribe</strong></li>
        </Ol>
        <Img alt="Setup wizard — Create Organization" src="/docs/login.png" />
        <Tip>You can also click &quot;Skip for now&quot; to explore with a default workspace name and rename it later in Settings.</Tip>

        <H3>Step 3: Explore Your Dashboard</H3>
        <P>You&apos;re now on the dashboard. As a creator, you&apos;ll see:</P>
        <Ul>
          <li><strong>Workspace Health</strong> &mdash; A visual summary of tasks, onboarding progress, and knowledge coverage</li>
          <li><strong>Quick Actions</strong> &mdash; Buttons to create tasks, add employees, and write SOPs</li>
          <li><strong>Sidebar</strong> &mdash; Navigation to all features: Tasks, Performance, Org Chart, Skills, Onboarding, SOPs, Integrations, and Settings</li>
        </Ul>
        <Img alt="Creator dashboard with workspace health and quick actions" src="/docs/dashboard-creator.png" />

        <H3>Step 4: Invite Your Team</H3>
        <P>Go to <strong>Settings</strong> (in the sidebar) and look for the invite section, or:</P>
        <Ol>
          <li>Navigate to the <strong>Admin Panel</strong> (bottom of sidebar, if you&apos;re a server admin)</li>
          <li>Or use the <strong>Add Employee</strong> quick action on the dashboard</li>
          <li>Each invite generates a unique link that expires in 7 days</li>
          <li>Share the link &mdash; recipients sign up and are automatically added to your workspace</li>
        </Ol>
        <Img alt="Invite page" src="/docs/invite-page.png" />
        <Warning>Invite links expire after 7 days. If someone&apos;s link expires, you&apos;ll need to generate a new one.</Warning>
      </>
    ),
  },
  {
    id: "employee-setup",
    title: "Employee: Getting Started",
    icon: LogIn,
    group: "start",
    content: () => (
      <>
        <H2>Getting Started as an Employee</H2>
        <RoleBadge role="employee" />

        <H3>Joining via Invite Link</H3>
        <P>Your workspace admin will share an invite link with you. Here&apos;s what happens:</P>
        <Ol>
          <li>Open the invite link in your browser</li>
          <li>You&apos;ll see which workspace is inviting you and your assigned role</li>
          <li>Click <strong>Sign up</strong> if you&apos;re new, or <strong>Log in</strong> if you already have an account</li>
          <li>After signing in, you&apos;re automatically added to the workspace</li>
        </Ol>
        <Img alt="Invite acceptance page" src="/docs/invite-page.png" />

        <H3>Your First Dashboard</H3>
        <P>Once you&apos;re in, your personal dashboard shows:</P>
        <Ul>
          <li><strong>My Work Health</strong> &mdash; Your personal task completion and onboarding progress</li>
          <li><strong>My Tasks</strong> &mdash; Tasks assigned to you</li>
          <li><strong>Quick Actions</strong> &mdash; View tasks, continue onboarding, or create tasks (if your admin allows it)</li>
        </Ul>
        <Img alt="Employee dashboard" src="/docs/dashboard-employee.png" />

        <H3>Mandatory Courses</H3>
        <P>If your workspace has mandatory onboarding courses, you&apos;ll be <strong>automatically enrolled</strong> when your account is created. Head to <strong>Onboarding</strong> in the sidebar to start.</P>
        <Tip>Your admin can see your onboarding progress, so completing courses promptly is a good first impression.</Tip>
      </>
    ),
  },

  /* ═══════════════════════════════════════════════
     FEATURES
     ═══════════════════════════════════════════════ */
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    group: "features",
    content: () => (
      <>
        <H2>Dashboard</H2>
        <RoleBadge role="both" />
        <P>The dashboard is your home base. It gives you an at-a-glance view of what matters most.</P>

        <H3>Creator / Admin View</H3>
        <P>As a workspace creator or moderator, your dashboard shows the big picture:</P>
        <Ul>
          <li><strong>Workspace Health</strong> &mdash; A donut chart combining task completion rate, onboarding progress, and knowledge base coverage</li>
          <li><strong>Task Flow</strong> &mdash; How many tasks are in each status (To Do, In Progress, Review, Done)</li>
          <li><strong>Priority Load</strong> &mdash; Distribution of High / Medium / Low priority tasks</li>
          <li><strong>Onboarding Progress</strong> &mdash; Shows the 5 employees with the lowest completion, with progress bars</li>
          <li><strong>Team Role Mix</strong> &mdash; Count of creators, moderators, and members</li>
          <li><strong>Latest Activity</strong> &mdash; The 5 most recently updated tasks</li>
        </Ul>
        <Img alt="Creator dashboard — workspace health, task flow, and quick actions" src="/docs/dashboard-creator.png" />

        <H3>Employee View</H3>
        <P>As a team member, your dashboard focuses on <em>your</em> work:</P>
        <Ul>
          <li><strong>Focus Score</strong> &mdash; A personal metric combining your task completion and onboarding progress</li>
          <li><strong>My Task Status</strong> &mdash; Your personal task breakdown</li>
          <li><strong>Assigned Tasks</strong> &mdash; Your 6 most recent tasks with status badges</li>
        </Ul>
        <Img alt="Employee dashboard — focus score and assigned tasks" src="/docs/dashboard-employee.png" />

        <H3>Quick Actions</H3>
        <P>Both views include shortcut buttons at the bottom:</P>
        <Ul>
          <li><strong>Create Task</strong> &mdash; Opens a quick task creation form (admin, or if permitted)</li>
          <li><strong>Add Employee</strong> &mdash; Directly add a team member (admin only)</li>
          <li><strong>New SOP</strong> &mdash; Start a new document (admin, or if permitted)</li>
          <li><strong>View My Tasks / Continue Onboarding</strong> &mdash; Quick links (employee view)</li>
        </Ul>
      </>
    ),
  },
  {
    id: "tasks",
    title: "Tasks",
    icon: CheckSquare,
    group: "features",
    content: () => (
      <>
        <H2>Tasks</H2>
        <RoleBadge role="both" />
        <P>Tasks are how your team tracks work. Every task has a title, status, priority, and can be assigned to a team member.</P>

        <H3>Task Statuses</H3>
        <P>Every task moves through 4 stages:</P>
        <div className="my-4 flex flex-wrap gap-2">
          {[
            { label: "To Do", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
            { label: "In Progress", color: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" },
            { label: "Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
            { label: "Done", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
          ].map((s) => <span key={s.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${s.color}`}>{s.label}</span>)}
        </div>

        <H3>Three Ways to View Tasks</H3>
        <P>Switch between views using the toggle at the top right of the tasks page:</P>
        <Ul>
          <li><strong>Kanban Board</strong> &mdash; Drag-and-drop cards between columns. Best for visual workflow management.</li>
          <li><strong>List View</strong> &mdash; Compact cards in a vertical list. Best for scanning quickly.</li>
          <li><strong>Table View</strong> &mdash; Spreadsheet-style with columns for status, priority, assignee, and due date. Best for large teams.</li>
        </Ul>
        <Img alt="Kanban board with tasks in 4 status columns" src="/docs/tasks-kanban.png" />
        <Img alt="Table view with status, priority, assignee columns" src="/docs/tasks-table.png" />

        <H3>Creating a Task</H3>
        <Ol>
          <li>Click the <strong>+ New Task</strong> button at the top right</li>
          <li>Enter a <strong>title</strong> (required) and optional description</li>
          <li>Set the <strong>priority</strong> (Low, Medium, High) and <strong>status</strong></li>
          <li>Optionally assign it to a team member</li>
          <li>Click <strong>Create Task</strong></li>
        </Ol>
        <Img alt="Create task modal" src="/docs/tasks-create.png" />

        <H3>Moving Tasks (Kanban)</H3>
        <P>In the Kanban view, simply <strong>drag a task card</strong> from one column to another. The status updates instantly.</P>

        <H3>Deleting a Task</H3>
        <P>Hover over a task card and click the <strong>trash icon</strong>. The task is removed immediately.</P>
        <Warning>Deleted tasks cannot be recovered. Make sure you really want to remove it.</Warning>

        <H3>Who can create tasks?</H3>
        <P>By default, all team members can create tasks. Your workspace admin can change this in <strong>Settings &gt; Permissions</strong> by toggling &quot;Members can create tasks.&quot;</P>
      </>
    ),
  },
  {
    id: "sops",
    title: "SOPs (Knowledge Base)",
    icon: BookOpen,
    group: "features",
    content: () => (
      <>
        <H2>SOPs &mdash; Your Knowledge Base</H2>
        <RoleBadge role="both" />
        <P>SOPs (Standard Operating Procedures) are documents that capture how your team does things. Think of it as your internal wiki.</P>

        <H3>Browsing SOPs</H3>
        <P>The SOPs page has a two-panel layout:</P>
        <Ul>
          <li><strong>Left panel</strong> &mdash; A searchable, filterable list of all SOPs</li>
          <li><strong>Right panel</strong> &mdash; The full document view with rich formatting</li>
        </Ul>
        <P>Use the <strong>search bar</strong> to find documents by title or content. Use <strong>category filters</strong> (General, Engineering, Design, HR) to narrow down.</P>
        <Img alt="SOPs page with categories, search, and document view" src="/docs/sops.png" />

        <H3>Creating a New SOP</H3>
        <Ol>
          <li>Click <strong>+ New SOP</strong> at the top right</li>
          <li>Enter a <strong>title</strong> and select a <strong>category</strong></li>
          <li>Write your content using the <strong>rich text editor</strong></li>
          <li>Click <strong>Create SOP</strong></li>
        </Ol>
        <Img alt="Create SOP modal with markdown editor" src="/docs/sops-create.png" />

        <H3>Using the Editor</H3>
        <P>The editor toolbar gives you quick formatting without memorizing Markdown:</P>
        <Ul>
          <li><strong>H1 / H2</strong> &mdash; Headings for section structure</li>
          <li><strong>B / I / Code</strong> &mdash; Bold, italic, and inline code</li>
          <li><strong>Link</strong> &mdash; Insert hyperlinks</li>
          <li><strong>Lists</strong> &mdash; Bullet lists, numbered lists, and checklists</li>
          <li><strong>Quote</strong> &mdash; Callout or blockquote</li>
          <li><strong>Table</strong> &mdash; Insert a 3-column table template</li>
          <li><strong>Divider</strong> &mdash; Horizontal line separator</li>
        </Ul>
        <P>Switch to <strong>Preview</strong> mode to see exactly how the document will look when published.</P>
        <Img alt="Markdown editor — Write mode with toolbar" src="/docs/editor-write.png" />
        <Img alt="Markdown editor — Preview mode with rendered content" src="/docs/editor-preview.png" />

        <H3>Editing &amp; Versioning</H3>
        <P>Click the <strong>pencil icon</strong> on any SOP to enter edit mode. Every save <strong>increments the version number</strong>, so your team always knows which version they&apos;re reading.</P>

        <H3>Who can create SOPs?</H3>
        <P>By default, only creators and moderators can create SOPs. This can be changed in <strong>Settings &gt; Permissions</strong>.</P>
      </>
    ),
  },
  {
    id: "onboarding",
    title: "Onboarding & Courses",
    icon: GraduationCap,
    group: "features",
    content: () => (
      <>
        <H2>Onboarding &amp; Learning</H2>

        <H3>For Employees</H3>
        <RoleBadge role="employee" />
        <P>When you join a workspace, you may be automatically enrolled in <strong>mandatory courses</strong>. Here&apos;s how to complete them:</P>
        <Ol>
          <li>Go to <strong>Onboarding</strong> in the sidebar</li>
          <li>You&apos;ll see your enrolled courses with a <strong>progress bar</strong> showing how far along you are</li>
          <li>Click a course card to open it</li>
          <li>Read through each <strong>lesson</strong> (use the sidebar to navigate between lessons)</li>
          <li>Click <strong>Mark as Complete</strong> when you finish a lesson</li>
          <li>When all lessons are done, the course is marked complete and you may earn a <strong>certification</strong></li>
        </Ol>
        <Img alt="Course viewer with lesson sidebar and content" src="/docs/onboarding-viewer.png" />
        <Tip>Use the &quot;Resume&quot; button on the progress banner to jump straight to your first incomplete mandatory course.</Tip>

        <H3>For Creators: Building Courses</H3>
        <RoleBadge role="creator" />
        <Ol>
          <li>Go to <strong>Onboarding</strong> and click <strong>+ New Course</strong></li>
          <li>Enter a <strong>title</strong> and <strong>description</strong></li>
          <li>Toggle <strong>Mandatory</strong> if all new employees should be auto-enrolled</li>
          <li>Add <strong>lessons</strong>: each lesson has a title, content (with the rich editor), and estimated time</li>
          <li>Click <strong>Create Course</strong></li>
        </Ol>
        <Img alt="Create course form with lesson builder" src="/docs/onboarding-create.png" />

        <H3>What happens when a course is completed?</H3>
        <P>Three things happen automatically:</P>
        <Ul>
          <li>A <strong>certification</strong> is issued to the employee&apos;s profile</li>
          <li>Any <strong>skills</strong> linked to the course are added to the employee&apos;s skills matrix</li>
          <li>Any <strong>skill gaps</strong> flagged in performance reviews (for those skills) are marked as resolved</li>
        </Ul>
      </>
    ),
  },
  {
    id: "performance",
    title: "Performance Reviews",
    icon: Target,
    group: "features",
    content: () => (
      <>
        <H2>Performance Management</H2>
        <RoleBadge role="creator" />
        <P>The Performance page has three tabs: <strong>OKRs</strong>, <strong>Review Cycles</strong>, and <strong>Reviews</strong>.</P>

        <H3>OKRs (Objectives &amp; Key Results)</H3>
        <P>OKRs let you set goals and track progress toward measurable targets.</P>
        <Ol>
          <li>Click <strong>+ Add OKR</strong></li>
          <li>Enter a <strong>title</strong> and optional description</li>
          <li>Set a <strong>metric</strong> name (e.g., &quot;Revenue&quot;) and <strong>target value</strong> (e.g., 100000)</li>
          <li>Optionally assign to an employee and link to a review cycle</li>
        </Ol>
        <P>Once created, you can update the <strong>current progress</strong> and change the <strong>status</strong> (On Track, At Risk, Behind, Completed) directly from the card.</P>
        <Img alt="OKRs tab with objective cards and progress" src="/docs/performance-okrs.png" />

        <H3>Review Cycles</H3>
        <P>A review cycle represents a period (typically quarterly) during which reviews are conducted.</P>
        <Ol>
          <li>Click <strong>+ New Cycle</strong></li>
          <li>Name the cycle (e.g., &quot;Q2 2026 Review&quot;), pick the quarter, and set dates</li>
          <li>The cycle starts as a <strong>Draft</strong> &mdash; you can add reviews before activating</li>
          <li>Click <strong>Activate</strong> to open the cycle for feedback</li>
          <li>Click <strong>Complete Cycle</strong> when all reviews are submitted</li>
        </Ol>
        <Img alt="Review Cycles tab with cycle cards" src="/docs/performance-cycles.png" />

        <H3>Writing a Review</H3>
        <Ol>
          <li>Assign a review: click <strong>+ Assign Review</strong>, pick the employee and cycle</li>
          <li>Open the review and click <strong>Write Feedback</strong></li>
          <li>Fill in: <strong>rating</strong> (1-5 stars), <strong>summary</strong>, <strong>strengths</strong>, and <strong>areas for improvement</strong></li>
          <li>Optionally flag <strong>skill gaps</strong> &mdash; select a skill and add notes about what needs improvement</li>
          <li>Click <strong>Submit Review</strong></li>
        </Ol>
        <Img alt="Reviews tab" src="/docs/performance-reviews.png" />

        <H3>Skill Gap &rarr; Course Recommendation</H3>
        <P>This is one of Radia&apos;s most powerful features. When you flag a skill gap in a review:</P>
        <Ul>
          <li>Radia automatically searches for a <strong>course that teaches that skill</strong></li>
          <li>The employee is <strong>auto-enrolled</strong> in the recommended course</li>
          <li>When they complete it, the gap is <strong>automatically resolved</strong></li>
        </Ul>
        <Tip>This creates a direct feedback loop between performance reviews and learning.</Tip>
      </>
    ),
  },
  {
    id: "skills",
    title: "Skills & Certifications",
    icon: Sparkles,
    group: "features",
    content: () => (
      <>
        <H2>Skills &amp; Certifications</H2>
        <RoleBadge role="creator" />
        <P>The Skills page gives you a bird&apos;s-eye view of your team&apos;s capabilities across three tabs.</P>

        <H3>Skills Matrix</H3>
        <P>A visual grid showing every employee and their skill levels. Each skill has a <strong>proficiency level</strong>:</P>
        <div className="my-4 flex flex-wrap gap-2">
          {[
            { label: "Beginner", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
            { label: "Intermediate", color: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" },
            { label: "Advanced", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" },
            { label: "Expert", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
          ].map((s) => <span key={s.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${s.color}`}>{s.label}</span>)}
        </div>
        <P>Skills can come from three sources:</P>
        <Ul>
          <li><strong>Manual</strong> &mdash; An admin assigned it directly</li>
          <li><strong>Certification</strong> &mdash; Earned by completing a course</li>
          <li><strong>Review</strong> &mdash; Identified during a performance review</li>
        </Ul>
        <Img alt="Skills matrix with proficiency badges" src="/docs/skills-matrix.png" />

        <H3>Skill Catalog</H3>
        <P>The workspace-level list of all skills, grouped by category. Admins can add new skills here.</P>

        <H3>Certifications</H3>
        <P>A list of all certifications earned by your team. Certifications are <strong>automatically issued</strong> when an employee completes a course. Each shows the course title, employee name, and date earned.</P>
        <Img alt="Certifications tab" src="/docs/skills-certs.png" />
      </>
    ),
  },
  {
    id: "org-chart",
    title: "Org Chart",
    icon: Network,
    group: "features",
    content: () => (
      <>
        <H2>Organization Chart</H2>
        <RoleBadge role="both" />
        <P>The Org Chart is an interactive visual map of your team hierarchy.</P>

        <H3>Navigating the Chart</H3>
        <Ul>
          <li><strong>Drag</strong> to pan around the chart</li>
          <li><strong>Scroll</strong> to zoom in and out</li>
          <li>Click <strong>Fit to Screen</strong> to auto-center everything</li>
          <li>Switch between <strong>Top-Down</strong> (vertical) and <strong>Left-Right</strong> (horizontal) layouts</li>
        </Ul>
        <Img alt="Org chart — top-down layout with node cards" src="/docs/org-chart.png" />

        <H3>Employee Details</H3>
        <P>Click any person&apos;s card to open a <strong>detail sidebar</strong> showing:</P>
        <Ul>
          <li>Full name, title, role, and email</li>
          <li>Who they report to (manager)</li>
          <li>Start date and onboarding status</li>
          <li>List of their direct reports</li>
        </Ul>
        <Img alt="Org chart with employee detail sidebar" src="/docs/org-chart-detail.png" />

        <H3>How is the hierarchy built?</H3>
        <P>The chart is built from the <strong>manager</strong> field on each employee profile. When you add an employee (or edit their profile), setting their manager determines where they appear in the tree.</P>
      </>
    ),
  },
  {
    id: "integrations",
    title: "Integrations & API Keys",
    icon: Plug,
    group: "features",
    content: () => (
      <>
        <H2>Integrations &amp; API Keys</H2>
        <RoleBadge role="creator" />

        <H3>Connecting Platforms</H3>
        <P>Radia supports 6 platform integrations. Each appears as a card with a toggle switch.</P>
        <Ol>
          <li>Go to <strong>Integrations</strong> in the sidebar</li>
          <li>Find the platform you want (Slack, GitHub, Gmail, Discord, Teams, or Messenger)</li>
          <li>Click the <strong>toggle switch</strong> to enable it</li>
          <li>Click <strong>Configure</strong> to enter your credentials (webhook URL, API token, etc.)</li>
          <li>Click <strong>Save Configuration</strong></li>
        </Ol>
        <Img alt="Integrations page with platform cards and toggles" src="/docs/integrations.png" />

        <H3>API Keys</H3>
        <P>API keys allow programmatic access to your workspace data. Only workspace admins can see this section.</P>

        <P><strong>Creating a key:</strong></P>
        <Ol>
          <li>Scroll down to the <strong>API Keys</strong> section</li>
          <li>Click <strong>+ New Key</strong></li>
          <li>Enter a <strong>name</strong> (e.g., &quot;CI/CD Pipeline&quot;) and select <strong>scopes</strong> (read, write, admin)</li>
          <li>Click <strong>Create Key</strong></li>
          <li>The full API key is shown <strong>once</strong> &mdash; copy it immediately</li>
        </Ol>
        <Img alt="API key creation modal" src="/docs/apikeys-create.png" />
        <Warning>The full API key is only shown once when created. If you lose it, you&apos;ll need to rotate or create a new one.</Warning>

        <P><strong>Rotating a key:</strong></P>
        <P>If you suspect a key has been compromised, click the <strong>rotate icon</strong> next to the key. This revokes the old key and generates a new one with the same name and permissions.</P>

        <P><strong>Revoking a key:</strong></P>
        <P>Click the <strong>trash icon</strong> to revoke a key. Revoked keys stop working immediately but remain visible in the list for audit purposes.</P>
        <Img alt="API keys table with rotate and revoke actions" src="/docs/integrations-apikeys.png" />
      </>
    ),
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    group: "features",
    content: () => (
      <>
        <H2>Settings</H2>

        <H3>Workspace Settings</H3>
        <RoleBadge role="creator" />
        <P>Change your organization&apos;s <strong>name</strong> and <strong>subdomain</strong>. These are visible to all team members.</P>
        <Img alt="Workspace settings" src="/docs/settings-workspace.png" />

        <H3>Permissions</H3>
        <RoleBadge role="creator" />
        <P>Control what your team members can do:</P>
        <Ul>
          <li><strong>Members can create tasks</strong> &mdash; On by default. Turn off to restrict task creation to admins.</li>
          <li><strong>Members can create SOPs</strong> &mdash; Off by default. Turn on to let everyone write documents.</li>
          <li><strong>Members can create courses</strong> &mdash; Off by default. Turn on to let everyone build training content.</li>
          <li><strong>Members can manage integrations</strong> &mdash; Off by default. Turn on to let everyone configure platform connections.</li>
          <li><strong>Allowed Integrations</strong> &mdash; Choose which platforms are visible to non-admin members.</li>
        </Ul>
        <Img alt="Workspace permissions with toggle switches" src="/docs/settings-permissions.png" />

        <H3>Profile Settings</H3>
        <RoleBadge role="both" />
        <P>Update your personal information: name, email, title. You can also <strong>change your password</strong> here (requires entering your current password first).</P>

        <H3>Notification Preferences</H3>
        <RoleBadge role="both" />
        <P>Choose how you want to be notified across three channels:</P>
        <Ul>
          <li><strong>Email</strong> &mdash; Daily digest, mentions &amp; replies</li>
          <li><strong>Slack</strong> &mdash; Task updates, milestone celebrations</li>
          <li><strong>In-App</strong> &mdash; All notifications, task reminders</li>
        </Ul>

        <H3>Danger Zone</H3>
        <RoleBadge role="creator" />
        <Warning>Deleting a workspace permanently removes all data including profiles, tasks, SOPs, courses, and reviews. This cannot be undone.</Warning>
      </>
    ),
  },
  {
    id: "admin",
    title: "Admin Panel",
    icon: Shield,
    group: "features",
    content: () => (
      <>
        <H2>Admin Panel</H2>
        <RoleBadge role="creator" />
        <P>The Admin Panel is only visible to workspace creators who are also server admins. It provides system-level oversight.</P>

        <H3>System Health</H3>
        <P>At-a-glance status of your workspace infrastructure: database health, API status, storage usage, and uptime.</P>

        <H3>Access Requests</H3>
        <P>When team members request elevated server roles (like devops or auditor access), their requests appear here. You can <strong>approve</strong> or <strong>reject</strong> each request, and every action is logged.</P>
        <Img alt="Admin panel with access requests and system health" src="/docs/admin.png" />

        <H3>Audit Log</H3>
        <P>A chronological record of all admin actions: who did what, and when. This includes request approvals, workspace changes, and other administrative operations.</P>
        <Img alt="Audit log with timestamped entries" src="/docs/admin-audit.png" />
      </>
    ),
  },

  /* ═══════════════════════════════════════════════
     HELP & REFERENCE
     ═══════════════════════════════════════════════ */
  {
    id: "faq",
    title: "FAQ & Troubleshooting",
    icon: HelpCircle,
    group: "help",
    content: () => (
      <>
        <H2>Frequently Asked Questions</H2>

        <H3>Account &amp; Access</H3>
        <FAQ q="I can't log in. What should I do?">
          <p>Make sure you&apos;re using the correct email and password. If you&apos;ve forgotten your password, you&apos;ll need to contact your workspace admin &mdash; there is no self-service password reset yet. If you&apos;re a new user, make sure you&apos;ve completed the signup process first.</p>
        </FAQ>
        <FAQ q="My invite link isn't working.">
          <p>Invite links expire after <strong>7 days</strong>. If yours has expired, ask your workspace admin to send a new one. Also make sure you&apos;re clicking the full link &mdash; partial URLs won&apos;t work.</p>
        </FAQ>
        <FAQ q="I signed up but can't see my workspace.">
          <p>If you signed up without an invite link, you&apos;re in your own personal workspace. To join your team&apos;s workspace, you need an invite link from your admin.</p>
        </FAQ>
        <FAQ q="What's the difference between Creator, Moderator, and User roles?">
          <p><strong>Creator</strong> has full control over the workspace &mdash; settings, permissions, billing, and can delete the workspace. <strong>Moderator</strong> can create content and manage reviews but can&apos;t change workspace settings. <strong>User</strong> is a regular team member whose capabilities are controlled by workspace permissions.</p>
        </FAQ>

        <H3>Tasks</H3>
        <FAQ q="I can't create tasks. Why?">
          <p>Your workspace admin may have disabled task creation for regular members. Ask them to enable &quot;Members can create tasks&quot; in <strong>Settings &gt; Permissions</strong>.</p>
        </FAQ>
        <FAQ q="Can I undo deleting a task?">
          <p>No. Deleted tasks are permanently removed. Double-check before deleting.</p>
        </FAQ>
        <FAQ q="How do I change a task's status?">
          <p>In <strong>Kanban view</strong>, drag the card between columns. In <strong>Table</strong> or <strong>List view</strong>, you can&apos;t change status inline &mdash; use the Kanban view for that.</p>
        </FAQ>

        <H3>SOPs &amp; Documents</H3>
        <FAQ q="Can I use images in SOPs?">
          <p>You can insert image links using the toolbar, but there is no direct file upload yet. Use an image hosting service and paste the URL.</p>
        </FAQ>
        <FAQ q="What Markdown formatting is supported?">
          <p>Headings, bold, italic, inline code, links, bullet lists, numbered lists, checklists, blockquotes, tables, horizontal dividers, and code blocks.</p>
        </FAQ>

        <H3>Onboarding &amp; Courses</H3>
        <FAQ q="I was auto-enrolled in a course I already know. Can I skip it?">
          <p>You&apos;ll need to complete it &mdash; mandatory courses can&apos;t be unenrolled. However, you can quickly mark each lesson as complete to finish the course.</p>
        </FAQ>
        <FAQ q="Do I get anything for completing a course?">
          <p>Yes! You automatically earn a <strong>certification</strong>, and any skills linked to the course are added to your profile. These are visible on the Skills page.</p>
        </FAQ>

        <H3>Performance &amp; Reviews</H3>
        <FAQ q="Who can see my review?">
          <p>Reviews are visible to workspace creators and moderators. The reviewer and reviewee can see the review they&apos;re involved in.</p>
        </FAQ>
        <FAQ q="What happens when a skill gap is flagged?">
          <p>Radia automatically finds a course that teaches that skill and enrolls the employee. When the course is completed, the gap is resolved.</p>
        </FAQ>

        <H3>Integrations</H3>
        <FAQ q="I don't see the API Keys section.">
          <p>API Keys are only visible to workspace creators and moderators. If you have the right role and still don&apos;t see it, try refreshing the page.</p>
        </FAQ>
        <FAQ q="I lost my API key. How do I get a new one?">
          <p>API keys are shown only once at creation. Click the <strong>rotate</strong> button (circular arrow icon) next to the key to generate a new one. The old key is immediately revoked.</p>
        </FAQ>
      </>
    ),
  },
  {
    id: "keyboard",
    title: "Tips & Shortcuts",
    icon: Key,
    group: "help",
    content: () => (
      <>
        <H2>Tips &amp; Shortcuts</H2>

        <H3>Navigation</H3>
        <Ul>
          <li>Use the <strong>sidebar</strong> (desktop) or <strong>hamburger menu</strong> (mobile) to navigate between sections</li>
          <li>The sidebar shows live status indicators for connected integrations</li>
          <li>Click the <strong>Radia</strong> logo in the sidebar to return to the dashboard</li>
        </Ul>

        <H3>Dark Mode</H3>
        <P>Toggle dark mode from the sidebar (desktop) or the top bar (mobile). Your preference is saved automatically.</P>

        <H3>Editor Shortcuts</H3>
        <P>In the SOP and lesson editors:</P>
        <Ul>
          <li>Press <strong>Tab</strong> to indent text</li>
          <li>Use the toolbar buttons to insert formatting without memorizing Markdown</li>
          <li>Switch to <strong>Preview</strong> to see the rendered result before saving</li>
        </Ul>

        <H3>Kanban Tips</H3>
        <Ul>
          <li>Drag tasks between columns to change status instantly</li>
          <li>Priority is shown as a colored dot: <span className="text-rose-500">red</span> = High, <span className="text-amber-500">amber</span> = Medium, <span className="text-emerald-500">green</span> = Low</li>
          <li>Integration badges (Slack, GitHub, Discord) appear on tasks synced from those platforms</li>
        </Ul>

        <H3>Performance Review Tips</H3>
        <Ul>
          <li>Flag skill gaps during reviews to automatically create learning paths</li>
          <li>Use the 1-5 star rating scale: 1 (Needs improvement) to 5 (Exceptional)</li>
          <li>Fill in both Strengths and Improvements for balanced feedback</li>
        </Ul>
      </>
    ),
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    icon: Users,
    group: "help",
    content: () => (
      <>
        <H2>Roles &amp; Permissions Reference</H2>

        <H3>Workspace Roles</H3>
        <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Feature</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-violet-600 dark:text-violet-300">Creator</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-300">Moderator</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-sky-600 dark:text-sky-300">User</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ["View dashboard", true, true, true],
                ["View org chart", true, true, true],
                ["View SOPs", true, true, true],
                ["Take courses", true, true, true],
                ["Create tasks", true, true, "perm"],
                ["Create SOPs", true, true, "perm"],
                ["Create courses", true, true, "perm"],
                ["Manage integrations", true, true, "perm"],
                ["Manage performance reviews", true, true, false],
                ["Manage skills catalog", true, true, false],
                ["Invite team members", true, true, false],
                ["Workspace settings", true, false, false],
                ["Workspace permissions", true, false, false],
                ["API keys", true, true, false],
                ["Admin panel", true, false, false],
                ["Delete workspace", true, false, false],
              ].map(([feature, creator, mod, user], i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{feature as string}</td>
                  {[creator, mod, user].map((v, j) => (
                    <td key={j} className="px-4 py-2 text-center">
                      {v === true && <span className="text-emerald-600 dark:text-emerald-400">Yes</span>}
                      {v === false && <span className="text-slate-300 dark:text-slate-600">&mdash;</span>}
                      {v === "perm" && <span className="text-amber-600 dark:text-amber-400">If enabled</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P><strong>&quot;If enabled&quot;</strong> means the workspace creator must turn on the corresponding permission in Settings &gt; Permissions for regular users to access this feature.</P>

        <H3>Server Roles</H3>
        <P>Server roles provide system-level access beyond the workspace:</P>
        <Ul>
          <li><strong>Super Admin</strong> &mdash; Full access to the admin panel, can approve/reject role requests</li>
          <li><strong>DevOps</strong> &mdash; System health monitoring and integration management</li>
          <li><strong>Auditor</strong> &mdash; Read-only access to audit logs and workspace data</li>
        </Ul>
      </>
    ),
  },

  /* ═══════════════════════════════════════════════
     ROADMAP & DEPLOYMENT
     ═══════════════════════════════════════════════ */
  {
    id: "supabase",
    title: "Supabase Setup",
    icon: Database,
    group: "roadmap",
    content: () => (
      <>
        <H2>Supabase Database Setup</H2>
        <P>Radia uses <strong>Supabase Postgres</strong> as its production database. The local dev environment uses SQLite for convenience, but Vercel&apos;s serverless functions cannot run native C++ addons like <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">better-sqlite3</code>, so Supabase is required for deployment.</P>

        <H3>Step 1: Create a Supabase Project</H3>
        <Ol>
          <li>Go to <strong>supabase.com/dashboard</strong> and click <strong>New Project</strong></li>
          <li>Choose a name (e.g., <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">radia-prod</code>) and a region close to your users</li>
          <li>Set a strong database password &mdash; save it securely</li>
          <li>Wait ~2 minutes for provisioning to complete</li>
        </Ol>

        <H3>Step 2: Run the Schema</H3>
        <Ol>
          <li>In the Supabase Dashboard, go to <strong>SQL Editor</strong></li>
          <li>Click <strong>New Query</strong></li>
          <li>Open the file <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">supabase/schema.sql</code> from the project root and copy the entire contents</li>
          <li>Paste into the SQL Editor and click <strong>Run</strong></li>
          <li>Verify: go to <strong>Table Editor</strong> &mdash; you should see 23 tables</li>
        </Ol>
        <Tip>The schema file creates everything: tables, indexes, foreign keys, CHECK constraints, UNIQUE constraints, auto-update triggers, and subscription/coupon tables for Stripe.</Tip>

        <H3>What the Schema Includes</H3>
        <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Module</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Tables</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ["Identity", "users, sessions, workspaces, profiles"],
                ["Operations", "tasks, sops, integrations, invites"],
                ["Learning", "courses, lessons, course_enrollments, course_skills"],
                ["Performance", "skills, profile_skills, review_cycles, objectives, reviews, review_skill_gaps, certifications"],
                ["Admin", "server_admins, admin_requests, audit_log, notification_preferences, workspace_preferences, api_keys"],
                ["Billing", "subscriptions, coupon_redemptions"],
              ].map(([mod, tables], i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{mod}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">{tables}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H3>Step 3: Get Your API Credentials</H3>
        <P>Go to <strong>Settings &rarr; API</strong> in the Supabase Dashboard and copy these three values:</P>
        <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Credential</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Env Variable</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Visibility</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ["Project URL", "NEXT_PUBLIC_SUPABASE_URL", "Public (safe for browser)"],
                ["anon public key", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "Public (safe for browser)"],
                ["service_role key", "SUPABASE_SERVICE_ROLE_KEY", "Secret (server-side only!)"],
              ].map(([cred, env, vis], i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{cred}</td>
                  <td className="px-4 py-2"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">{env}</code></td>
                  <td className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">{vis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Warning>The <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">service_role</code> key bypasses Row-Level Security. Never put it in a <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">NEXT_PUBLIC_</code> variable. Only use it in server-side API routes.</Warning>

        <H3>Step 4: Migrate the Code</H3>
        <P>The key change is replacing synchronous SQLite calls with async Supabase client calls across all 24 API route files. Here are the patterns:</P>

        <P><strong>SELECT (list rows):</strong></P>
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`// SQLite (before)
db.prepare("SELECT * FROM tasks WHERE workspace_id = ?").all(wsId)

// Supabase (after)
const { data } = await supabase.from('tasks').select('*').eq('workspace_id', wsId)`}</pre>
        </div>

        <P><strong>SELECT with JOIN:</strong></P>
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`// SQLite
db.prepare("SELECT t.*, p.first_name FROM tasks t JOIN profiles p ON p.id = t.assignee_id WHERE t.workspace_id = ?").all(wsId)

// Supabase (foreign key joins)
const { data } = await supabase
  .from('tasks')
  .select('*, assignee:profiles!assignee_id(first_name, last_name)')
  .eq('workspace_id', wsId)`}</pre>
        </div>

        <P><strong>INSERT:</strong></P>
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`// SQLite
db.prepare("INSERT INTO tasks (id, workspace_id, title) VALUES (?, ?, ?)").run(id, wsId, title)

// Supabase
const { data } = await supabase.from('tasks').insert({ workspace_id: wsId, title }).select().single()`}</pre>
        </div>

        <P><strong>UPDATE:</strong></P>
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`// SQLite
db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id)

// Supabase
const { data } = await supabase.from('tasks').update({ status }).eq('id', id).select().single()`}</pre>
        </div>

        <P><strong>DELETE:</strong></P>
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`// SQLite
db.prepare("DELETE FROM tasks WHERE id = ?").run(id)

// Supabase
await supabase.from('tasks').delete().eq('id', id)`}</pre>
        </div>

        <H3>Key Differences to Remember</H3>
        <Ul>
          <li><strong>Booleans</strong> &mdash; SQLite uses <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">0/1</code>, Postgres uses native <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">true/false</code>. Remove all <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">!!(value as number)</code> conversions.</li>
          <li><strong>JSON</strong> &mdash; SQLite stores JSON as TEXT strings requiring <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">JSON.parse()</code>. Postgres JSONB is auto-parsed &mdash; no parsing needed.</li>
          <li><strong>Dates</strong> &mdash; SQLite uses <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">datetime(&apos;now&apos;)</code>. Postgres uses <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">NOW()</code>, but Supabase handles defaults automatically on insert.</li>
          <li><strong>UUIDs</strong> &mdash; You no longer need to call <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">uid()</code> for IDs. Postgres generates them via <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">gen_random_uuid()</code> default.</li>
          <li><strong>Async</strong> &mdash; All Supabase queries are async. Add <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">await</code> to every query call.</li>
        </Ul>

        <H3>Step 5: Clean Up</H3>
        <P>After migrating all routes, remove the SQLite dependency:</P>
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`npm uninstall better-sqlite3 @types/better-sqlite3`}</pre>
        </div>
        <P>And remove <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">serverExternalPackages: [&quot;better-sqlite3&quot;]</code> from <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">next.config.ts</code>.</P>
      </>
    ),
  },
  {
    id: "vercel",
    title: "Vercel Deployment",
    icon: Globe,
    group: "roadmap",
    content: () => (
      <>
        <H2>Deploying to Vercel</H2>
        <P>Vercel is the recommended hosting platform for Radia. It provides automatic builds, SSL, edge caching, serverless functions, and preview deployments for every pull request.</P>

        <H3>Production Architecture</H3>
        <div className="my-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-4 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`Users (Browser)
    │ HTTPS (auto-SSL via Let's Encrypt)
    ▼
Vercel Edge Network (CDN + Serverless)
    │  Next.js 16 — Static assets cached at edge
    │  API Routes — Serverless functions (Node.js 20)
    │
    ├──→ Supabase Postgres   (Database — connection pooling)
    ├──→ Supabase Storage    (Avatars, attachments)
    ├──→ Stripe              (Subscriptions, coupons, invoices)
    └──→ Resend              (Transactional email)`}</pre>
        </div>

        <H3>Step 1: Push to GitHub</H3>
        <P>Make sure your code is pushed to a GitHub repository. Vercel deploys directly from GitHub.</P>
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`git add -A
git commit -m "ready for Vercel deployment"
git push origin main`}</pre>
        </div>

        <H3>Step 2: Import in Vercel</H3>
        <Ol>
          <li>Go to <strong>vercel.com/new</strong></li>
          <li>Click <strong>Import Git Repository</strong> and select your repo</li>
          <li>Vercel auto-detects Next.js &mdash; the defaults are correct:
            <Ul>
              <li><strong>Framework</strong>: Next.js</li>
              <li><strong>Build Command</strong>: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">npm run build</code></li>
              <li><strong>Output Directory</strong>: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">.next</code></li>
            </Ul>
          </li>
        </Ol>

        <H3>Step 3: Set Environment Variables</H3>
        <P>Before clicking Deploy, add these environment variables in the Vercel project settings:</P>
        <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Variable</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Value</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Where to Find</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {[
                ["NEXT_PUBLIC_SITE_URL", "https://your-app.vercel.app", "Your Vercel project URL"],
                ["NEXT_PUBLIC_SUPABASE_URL", "https://xxx.supabase.co", "Supabase → Settings → API"],
                ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJ...", "Supabase → Settings → API"],
                ["SUPABASE_SERVICE_ROLE_KEY", "eyJ...", "Supabase → Settings → API"],
                ["STRIPE_SECRET_KEY", "sk_live_...", "Stripe → Developers → API Keys"],
                ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_live_...", "Stripe → Developers → API Keys"],
                ["STRIPE_WEBHOOK_SECRET", "whsec_...", "Stripe → Webhooks → Signing Secret"],
                ["RESEND_API_KEY", "re_...", "Resend → API Keys"],
                ["CRON_SECRET", "(random 64-char hex)", "Generate with: openssl rand -hex 32"],
              ].map(([variable, value, where], i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-mono text-slate-700 dark:text-slate-300">{variable}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{value}</td>
                  <td className="px-4 py-2 text-slate-400 dark:text-slate-500">{where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Tip>Stripe and Resend variables are optional &mdash; the app works without them (billing and email features are simply disabled). You can add them later.</Tip>

        <H3>Step 4: Deploy</H3>
        <P>Click <strong>Deploy</strong>. Vercel will clone, install, build, and deploy in ~2 minutes. You&apos;ll get a live URL like <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">your-app.vercel.app</code> immediately.</P>

        <H3>Step 5: Custom Domain (Optional)</H3>
        <Ol>
          <li>Go to your Vercel project &rarr; <strong>Settings &rarr; Domains</strong></li>
          <li>Add your domain (e.g., <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">app.radiacorp.com</code>)</li>
          <li>Update your DNS: add a <strong>CNAME</strong> record pointing to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">cname.vercel-dns.com</code></li>
          <li>SSL is auto-provisioned &mdash; no configuration needed</li>
        </Ol>

        <H3>Step 6: Stripe Webhook (If Using Billing)</H3>
        <Ol>
          <li>Go to Stripe &rarr; <strong>Developers &rarr; Webhooks</strong></li>
          <li>Click <strong>Add endpoint</strong></li>
          <li>Enter: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">https://your-domain.com/api/billing/webhook</code></li>
          <li>Select events: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">checkout.session.completed</code>, <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">customer.subscription.updated</code>, <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">customer.subscription.deleted</code>, <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">invoice.payment_failed</code></li>
          <li>Copy the <strong>Signing Secret</strong> and add it as <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">STRIPE_WEBHOOK_SECRET</code> in Vercel</li>
        </Ol>

        <H3>Step 7: Daily Digest Cron (If Using Email)</H3>
        <P>To enable daily digest emails, create a <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">vercel.json</code> in the project root:</P>
        <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
          <pre className="text-xs leading-relaxed text-slate-300">{`{
  "crons": [{
    "path": "/api/cron/digest",
    "schedule": "0 8 * * *"
  }]
}`}</pre>
        </div>
        <P>This triggers the digest endpoint every day at 8 AM UTC.</P>

        <H3>Automatic Deploys</H3>
        <P>Every push to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">main</code> triggers an automatic production deployment. Pull requests get <strong>preview deployments</strong> with unique URLs &mdash; perfect for testing changes before merging.</P>

        <H3>Estimated Monthly Cost</H3>
        <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Service</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Free Tier</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Pro Tier</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ["Vercel", "100GB bandwidth, serverless", "$20/mo (teams, analytics)"],
                ["Supabase", "500MB DB, 1GB storage", "$25/mo (8GB DB, backups)"],
                ["Stripe", "No monthly fee", "2.9% + $0.30 per txn"],
                ["Resend", "3,000 emails/mo", "$20/mo (50K emails)"],
                ["Domain", "—", "~$12/year"],
              ].map(([service, free, pro], i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{service}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{free}</td>
                  <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-400">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>Launch on <strong>$0/month</strong> with free tiers. Scale to ~$45/month as you grow.</P>

        <H3>Post-Deploy Checklist</H3>
        <Ul>
          <li>Verify the app loads at your Vercel URL</li>
          <li>Test login with your admin account</li>
          <li>Create a task, SOP, and course to verify database connectivity</li>
          <li>Test the invite flow end-to-end</li>
          <li>Verify <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">SUPABASE_SERVICE_ROLE_KEY</code> is not exposed in browser network requests</li>
          <li>Enable Vercel Analytics in project settings</li>
          <li>Set up Supabase backups (auto on Pro plan)</li>
        </Ul>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "Subscriptions & Billing",
    icon: CreditCard,
    group: "roadmap",
    content: () => (
      <>
        <H2>Subscriptions &amp; Billing</H2>
        <P>Radia uses <strong>Stripe</strong> for subscription management, payment processing, and coupon/promotion codes.</P>

        <H3>Pricing Plans</H3>
        <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { name: "Free", price: "$0", features: ["3 team members", "1 course", "5 SOPs", "Basic tasks"] },
            { name: "Pro", price: "$12/mo", features: ["Unlimited members", "Unlimited courses & SOPs", "All integrations", "API keys", "Performance reviews"] },
            { name: "Enterprise", price: "$49/mo", features: ["Everything in Pro", "SSO support", "Priority support", "Custom branding", "Advanced analytics"] },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-xl border p-5 ${plan.name === "Pro" ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/30 dark:bg-indigo-500/5" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.price}</p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="h-1 w-1 rounded-full bg-indigo-500" />{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <H3>How Billing Works</H3>
        <Ol>
          <li>Workspace creator clicks <strong>Upgrade</strong> in Settings</li>
          <li>Redirected to <strong>Stripe Checkout</strong> — secure, hosted payment page</li>
          <li>After payment, the workspace plan is activated immediately via webhook</li>
          <li>Creators can manage billing, download invoices, or cancel via the <strong>Customer Portal</strong></li>
        </Ol>

        <H3>Plan Enforcement</H3>
        <P>Free-tier workspaces have limits on members, courses, and SOPs. When a limit is reached, users see an upgrade prompt instead of the create button. Existing data is never deleted when downgrading — it becomes read-only.</P>

        <H3>Coupons &amp; Promotions</H3>
        <P>Stripe handles coupon codes natively. During checkout, users can enter a promotion code for discounts:</P>
        <Ul>
          <li><strong>Percentage off</strong> — e.g., 50% off for first 3 months</li>
          <li><strong>Fixed amount</strong> — e.g., $5 off per month</li>
          <li><strong>Duration</strong> — once, repeating (N months), or forever</li>
        </Ul>
        <P>Promotion codes (like <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">WELCOME50</code>) are created in the Stripe Dashboard or via the admin API. Each code can have a maximum redemption count and expiration date.</P>
        <Tip>Launch tip: Create a &quot;LAUNCH50&quot; code for 50% off the first 3 months to incentivize early adopters.</Tip>
      </>
    ),
  },
  {
    id: "email",
    title: "Email Notifications",
    icon: Mail,
    group: "roadmap",
    content: () => (
      <>
        <H2>Email Notifications</H2>
        <P>Radia uses <strong>Resend</strong> for transactional emails. Every important event in the platform triggers an email to keep your team informed.</P>

        <H3>Email Types</H3>
        <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Email</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Trigger</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">Recipient</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ["Workspace Invite", "Admin creates an invite", "Invited email address"],
                ["Welcome Email", "User completes signup", "New user"],
                ["Task Assigned", "Task is assigned to someone", "Assignee"],
                ["Review Assigned", "Performance review is created", "Reviewee"],
                ["Course Completed", "All lessons marked complete", "Employee"],
                ["Payment Failed", "Stripe payment fails", "Workspace creator"],
                ["Daily Digest", "Daily cron job (morning)", "Users with digest enabled"],
              ].map(([email, trigger, recipient], i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{email}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{trigger}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{recipient}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H3>Email Preferences</H3>
        <P>Users control which emails they receive in <strong>Settings &gt; Notification Preferences</strong>:</P>
        <Ul>
          <li><strong>Email digest</strong> — Daily summary of tasks, reviews, and progress</li>
          <li><strong>Mentions &amp; replies</strong> — When someone mentions you or replies to your review</li>
        </Ul>
        <P>System emails (invites, payment issues) are always sent regardless of preferences.</P>

        <H3>Daily Digest</H3>
        <P>The daily digest email includes:</P>
        <Ul>
          <li>New tasks assigned since yesterday</li>
          <li>Tasks completed yesterday</li>
          <li>Pending performance reviews</li>
          <li>Course progress summary</li>
        </Ul>
        <Tip>The digest runs via a cron job every morning. Users who have disabled &quot;Daily digest&quot; in their notification preferences will not receive it.</Tip>
      </>
    ),
  },
  {
    id: "roadmap",
    title: "Roadmap",
    icon: Rocket,
    group: "roadmap",
    content: () => (
      <>
        <H2>Product Roadmap</H2>
        <P>Planned features and improvements for Radia, organized by release phase.</P>

        <H3>Phase 1 — Foundation (Current)</H3>
        <Ul>
          <li>HRIS: Employee profiles, org chart, role management</li>
          <li>Task management with kanban, list, and table views</li>
          <li>SOP knowledge base with WYSIWYG editor</li>
          <li>LMS with courses, lessons, and progress tracking</li>
          <li>Performance reviews, OKRs, and skill-gap bridging</li>
          <li>Skills matrix and auto-certifications</li>
          <li>Platform integrations (Slack, GitHub, Gmail, Discord, Teams, Messenger)</li>
          <li>API key management with rotate/revoke</li>
          <li>Dark mode and mobile responsive design</li>
        </Ul>

        <H3>Phase 2 — Production Launch</H3>
        <Ul>
          <li>Migrate to Supabase Postgres</li>
          <li>Deploy to Vercel</li>
          <li>Stripe subscription billing (Free / Pro / Enterprise)</li>
          <li>Coupon and promotion code support</li>
          <li>Transactional emails via Resend</li>
          <li>Daily digest emails</li>
          <li>File uploads (avatars, SOP attachments)</li>
          <li>Password reset via email</li>
        </Ul>

        <H3>Phase 3 — Growth</H3>
        <Ul>
          <li>Supabase Auth integration (Google/GitHub OAuth, magic links, MFA)</li>
          <li>Real-time updates via Supabase Realtime (live task board, notifications)</li>
          <li>Advanced analytics dashboard with charts and exports</li>
          <li>Bulk import employees from CSV</li>
          <li>Custom fields on profiles and tasks</li>
          <li>Workflow automation (if X then Y triggers)</li>
          <li>Mobile app (React Native or PWA)</li>
        </Ul>

        <H3>Phase 4 — Enterprise</H3>
        <Ul>
          <li>SAML/SSO for enterprise customers</li>
          <li>Audit log export and compliance reports</li>
          <li>Custom branding (logo, colors)</li>
          <li>Multi-language support (i18n)</li>
          <li>API rate limiting and usage dashboards</li>
          <li>Dedicated support and SLA</li>
        </Ul>
      </>
    ),
  },
];

/* ── Group labels ────────────────────────────────────── */

const groups = [
  { key: "start", label: "Getting Started" },
  { key: "features", label: "Features" },
  { key: "help", label: "Help & Reference" },
  { key: "roadmap", label: "Deployment & Roadmap" },
] as const;

/* ── Main component ──────────────────────────────────── */

export function DocsContent() {
  const [activeId, setActiveId] = useState("welcome");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter((s) => s.title.toLowerCase().includes(q) || s.id.includes(q));
  }, [search]);

  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  function navigateTo(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 md:sticky md:top-0 md:h-screen md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Radia</span>
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              </Link>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">User Guide</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guide..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            {groups.map((group) => {
              const groupSections = filtered.filter((s) => s.group === group.key);
              if (groupSections.length === 0) return null;
              return (
                <div key={group.key} className="mb-4">
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{group.label}</p>
                  <div className="space-y-0.5">
                    {groupSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = section.id === activeId;
                      return (
                        <button
                          key={section.id}
                          onClick={() => navigateTo(section.id)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                            isActive
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {section.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Guide</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-slate-900 dark:text-slate-100">{active.title}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleDark} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/dashboard" className="hidden rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 sm:inline-flex">
              Open App
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          {active.content()}

          {/* Prev / Next */}
          <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
            {(() => {
              const idx = sections.findIndex((s) => s.id === activeId);
              const prev = idx > 0 ? sections[idx - 1] : null;
              const next = idx < sections.length - 1 ? sections[idx + 1] : null;
              return (
                <>
                  {prev ? (
                    <button onClick={() => navigateTo(prev.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                      &larr; {prev.title}
                    </button>
                  ) : <div />}
                  {next ? (
                    <button onClick={() => navigateTo(next.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                      {next.title} &rarr;
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
