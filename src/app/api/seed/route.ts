import { NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    const db = getDb();

    // Only seed if no users exist
    const userCount = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };

    if (userCount.count > 0) {
      return NextResponse.json(
        { error: "Database already has users. Seed aborted." },
        { status: 409 }
      );
    }

    // --- Admin user ---
    const adminUserId = uid();
    const adminHash = await hashPassword("password123");
    db.prepare(
      "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)"
    ).run(adminUserId, "admin@radiacorp.com", adminHash);

    // --- Workspace ---
    const workspaceId = uid();
    db.prepare(
      "INSERT INTO workspaces (id, name, subdomain) VALUES (?, ?, ?)"
    ).run(workspaceId, "Radia HQ", "radia-hq");

    // --- Admin profile ---
    const adminProfileId = uid();
    db.prepare(
      `INSERT INTO profiles (id, user_id, workspace_id, email, first_name, last_name, role, title, onboarding_completed, setup_completed)
       VALUES (?, ?, ?, ?, ?, ?, 'creator', ?, 1, 1)`
    ).run(
      adminProfileId,
      adminUserId,
      workspaceId,
      "admin@radiacorp.com",
      "Claude",
      "Admin",
      "CTO & AI Operations Lead"
    );

    // --- Server admin ---
    db.prepare(
      "INSERT INTO server_admins (id, profile_id, server_role, granted_by) VALUES (?, ?, 'super_admin', ?)"
    ).run(uid(), adminProfileId, adminProfileId);

    // --- Notification preferences for admin ---
    db.prepare(
      "INSERT INTO notification_preferences (id, profile_id) VALUES (?, ?)"
    ).run(uid(), adminProfileId);

    // --- Sample employees ---
    const employees = [
      {
        email: "sarah@radiacorp.com",
        first_name: "Sarah",
        last_name: "Chen",
        role: "moderator",
        title: "VP Engineering",
      },
      {
        email: "marcus@radiacorp.com",
        first_name: "Marcus",
        last_name: "Rivera",
        role: "user",
        title: "Senior Developer",
      },
      {
        email: "priya@radiacorp.com",
        first_name: "Priya",
        last_name: "Patel",
        role: "user",
        title: "UX Designer",
      },
      {
        email: "james@radiacorp.com",
        first_name: "James",
        last_name: "Okafor",
        role: "moderator",
        title: "HR Manager",
      },
      {
        email: "lin@radiacorp.com",
        first_name: "Lin",
        last_name: "Wei",
        role: "user",
        title: "DevOps Engineer",
      },
    ];

    const employeeIds: string[] = [];
    const insertProfile = db.prepare(
      `INSERT INTO profiles (id, workspace_id, email, first_name, last_name, role, title, manager_id, onboarding_completed, setup_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`
    );
    const insertNotifPref = db.prepare(
      "INSERT INTO notification_preferences (id, profile_id) VALUES (?, ?)"
    );

    for (const emp of employees) {
      const empId = uid();
      employeeIds.push(empId);
      insertProfile.run(
        empId,
        workspaceId,
        emp.email,
        emp.first_name,
        emp.last_name,
        emp.role,
        emp.title,
        adminProfileId
      );
      insertNotifPref.run(uid(), empId);
    }

    // --- Integrations ---
    const platforms = [
      "slack",
      "github",
      "gmail",
      "discord",
      "teams",
      "messenger",
    ];
    const insertIntegration = db.prepare(
      "INSERT INTO integrations (id, workspace_id, platform_name, is_active) VALUES (?, ?, ?, 0)"
    );
    for (const platform of platforms) {
      insertIntegration.run(uid(), workspaceId, platform);
    }

    // --- Workspace preferences ---
    db.prepare("INSERT INTO workspace_preferences (id, workspace_id) VALUES (?, ?)").run(uid(), workspaceId);

    // --- SOPs ---
    const insertSop = db.prepare(
      `INSERT INTO sops (id, workspace_id, title, content, category, last_updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    insertSop.run(
      uid(),
      workspaceId,
      "Code Review Standards",
      `# Code Review Standards

## Purpose
Establish consistent code review practices across all engineering teams to maintain code quality, share knowledge, and catch issues early.

## Process
1. All code changes must be submitted as pull requests
2. At least one approval is required before merging
3. Reviews should be completed within 24 hours
4. Use constructive feedback and suggest improvements

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests are included for new functionality
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance implications considered

## Review Types
- **Standard Review**: For most changes, requires 1 reviewer
- **Critical Review**: For security/infrastructure changes, requires 2 reviewers
- **Quick Review**: For typos/docs, can be self-merged after CI passes`,
      "Engineering",
      adminProfileId
    );

    insertSop.run(
      uid(),
      workspaceId,
      "New Employee Onboarding Checklist",
      `# New Employee Onboarding Checklist

## First Day
- [ ] Complete HR paperwork and benefits enrollment
- [ ] Receive laptop and equipment setup
- [ ] Get access to email, Slack, and company tools
- [ ] Meet your manager and team members
- [ ] Review company handbook and policies

## First Week
- [ ] Complete mandatory security training
- [ ] Set up development environment
- [ ] Attend team standup meetings
- [ ] Review current projects and documentation
- [ ] Schedule 1-on-1s with key stakeholders

## First Month
- [ ] Complete all onboarding courses
- [ ] Make first contribution to codebase
- [ ] Understand team workflows and processes
- [ ] Set 30-60-90 day goals with manager
- [ ] Provide feedback on onboarding experience`,
      "HR",
      adminProfileId
    );

    insertSop.run(
      uid(),
      workspaceId,
      "Remote Work Policy",
      `# Remote Work Policy

## Eligibility
All full-time employees are eligible for remote work after completing their onboarding period. Hybrid and fully remote arrangements are available based on role requirements.

## Equipment
- Company provides laptop and essential peripherals
- $500 annual stipend for home office setup
- IT support available for remote troubleshooting
- VPN access required for all remote connections

## Communication
- Be available during core hours (10 AM - 3 PM local time)
- Respond to messages within 2 hours during work hours
- Camera on for team meetings when possible
- Use async communication for non-urgent matters

## Work Hours
- Standard work week is 40 hours
- Flexible scheduling around core hours
- Time tracking required for project billing
- Overtime must be pre-approved by manager`,
      "General",
      adminProfileId
    );

    // --- Tasks ---
    const allProfileIds = [adminProfileId, ...employeeIds];
    const taskData = [
      {
        title: "Set up CI/CD pipeline for new microservice",
        description:
          "Configure GitHub Actions for automated testing and deployment of the notification service.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assignee_idx: 4, // Lin Wei
      },
      {
        title: "Review Q2 hiring plan",
        description:
          "Review and approve the hiring plan for Q2, including headcount and budget allocation.",
        status: "TODO",
        priority: "HIGH",
        assignee_idx: 3, // James Okafor
      },
      {
        title: "Update API documentation",
        description:
          "Document new endpoints for the v2 API including authentication changes.",
        status: "REVIEW",
        priority: "MEDIUM",
        assignee_idx: 1, // Marcus Rivera
      },
      {
        title: "Design new dashboard wireframes",
        description:
          "Create wireframes for the redesigned analytics dashboard with improved data visualization.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        assignee_idx: 2, // Priya Patel
      },
      {
        title: "Implement SSO integration",
        description:
          "Add SAML-based SSO support for enterprise customers.",
        status: "TODO",
        priority: "HIGH",
        assignee_idx: 0, // Sarah Chen
      },
      {
        title: "Conduct security audit",
        description:
          "Perform quarterly security audit of all production systems and document findings.",
        status: "TODO",
        priority: "HIGH",
        assignee_idx: 4, // Lin Wei
      },
      {
        title: "Write onboarding guide for new developers",
        description:
          "Create a comprehensive getting-started guide for new engineering hires.",
        status: "DONE",
        priority: "LOW",
        assignee_idx: 1, // Marcus Rivera
      },
      {
        title: "Plan team offsite event",
        description:
          "Organize the quarterly team building event including venue, agenda, and logistics.",
        status: "DONE",
        priority: "LOW",
        assignee_idx: 3, // James Okafor
      },
    ];

    const insertTask = db.prepare(
      `INSERT INTO tasks (id, workspace_id, title, description, status, priority, creator_id, assignee_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const task of taskData) {
      insertTask.run(
        uid(),
        workspaceId,
        task.title,
        task.description,
        task.status,
        task.priority,
        adminProfileId,
        allProfileIds[task.assignee_idx + 1] // +1 because allProfileIds[0] is admin
      );
    }

    // --- Courses ---
    const course1Id = uid();
    db.prepare(
      `INSERT INTO courses (id, workspace_id, title, description, is_mandatory)
       VALUES (?, ?, ?, ?, 1)`
    ).run(
      course1Id,
      workspaceId,
      "Welcome to Radia",
      "Get started with Radia - learn about our company, team structure, and the tools we use."
    );

    const insertLesson = db.prepare(
      `INSERT INTO lessons (id, course_id, title, content, sort_order, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    insertLesson.run(
      uid(),
      course1Id,
      "Company Overview",
      "Learn about Radia's mission, values, and history. Understand our position in the market and our goals for the future.",
      1,
      5
    );
    insertLesson.run(
      uid(),
      course1Id,
      "Team Structure",
      "Understand how our teams are organized, key roles and responsibilities, and how cross-functional collaboration works.",
      2,
      3
    );
    insertLesson.run(
      uid(),
      course1Id,
      "Tools & Access",
      "Set up your development environment, get access to necessary tools, and learn our workflow processes.",
      3,
      4
    );

    const course2Id = uid();
    db.prepare(
      `INSERT INTO courses (id, workspace_id, title, description, is_mandatory)
       VALUES (?, ?, ?, ?, 1)`
    ).run(
      course2Id,
      workspaceId,
      "Security & Compliance",
      "Essential security practices and compliance requirements every team member must know."
    );

    insertLesson.run(
      uid(),
      course2Id,
      "Data Security",
      "Learn about data classification, encryption practices, secure communication, and how to handle sensitive information.",
      1,
      6
    );
    insertLesson.run(
      uid(),
      course2Id,
      "Compliance Basics",
      "Understand regulatory requirements, company policies, audit procedures, and your responsibilities for maintaining compliance.",
      2,
      5
    );

    return NextResponse.json({ ok: true, message: "Seeded successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
