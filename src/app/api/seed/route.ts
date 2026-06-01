import { NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    const db = getDb();

    // Only seed if no users exist — this is the safety gate
    const { count, error: countErr } = await db
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countErr) throw countErr;
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Database already has users. Seed aborted." },
        { status: 403 }
      );
    }

    // --- Admin user ---
    const adminUserId = uid();
    const adminHash = await hashPassword("password123");
    await db.from("users").insert({
      id: adminUserId,
      email: "admin@radiacorp.com",
      password_hash: adminHash,
    });

    // --- Workspace ---
    const workspaceId = uid();
    await db.from("workspaces").insert({
      id: workspaceId,
      name: "Radia HQ",
      subdomain: "radia-hq",
    });

    // --- Admin profile ---
    const adminProfileId = uid();
    await db.from("profiles").insert({
      id: adminProfileId,
      user_id: adminUserId,
      workspace_id: workspaceId,
      email: "admin@radiacorp.com",
      first_name: "Claude",
      last_name: "Admin",
      role: "creator",
      title: "CTO & AI Operations Lead",
      onboarding_completed: true,
      setup_completed: true,
    });

    // --- Server admin ---
    await db.from("server_admins").insert({
      id: uid(),
      profile_id: adminProfileId,
      server_role: "super_admin",
      granted_by: adminProfileId,
    });

    // --- Notification preferences for admin ---
    await db.from("notification_preferences").insert({
      id: uid(),
      profile_id: adminProfileId,
    });

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
    const profileInserts = [];
    const notifInserts = [];

    for (const emp of employees) {
      const empId = uid();
      employeeIds.push(empId);
      profileInserts.push({
        id: empId,
        workspace_id: workspaceId,
        email: emp.email,
        first_name: emp.first_name,
        last_name: emp.last_name,
        role: emp.role,
        title: emp.title,
        manager_id: adminProfileId,
        onboarding_completed: false,
        setup_completed: false,
      });
      notifInserts.push({
        id: uid(),
        profile_id: empId,
      });
    }

    await db.from("profiles").insert(profileInserts);
    await db.from("notification_preferences").insert(notifInserts);

    // --- Integrations ---
    const platforms = [
      "slack",
      "github",
      "gmail",
      "discord",
      "teams",
      "messenger",
    ];
    const integrationInserts = platforms.map((platform) => ({
      id: uid(),
      workspace_id: workspaceId,
      platform_name: platform,
      is_active: false,
    }));
    await db.from("integrations").insert(integrationInserts);

    // --- Workspace preferences ---
    await db.from("workspace_preferences").insert({
      id: uid(),
      workspace_id: workspaceId,
    });

    // --- SOPs ---
    const sopInserts = [
      {
        id: uid(),
        workspace_id: workspaceId,
        title: "Code Review Standards",
        content: `# Code Review Standards

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
        category: "Engineering",
        last_updated_by: adminProfileId,
      },
      {
        id: uid(),
        workspace_id: workspaceId,
        title: "New Employee Onboarding Checklist",
        content: `# New Employee Onboarding Checklist

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
        category: "HR",
        last_updated_by: adminProfileId,
      },
      {
        id: uid(),
        workspace_id: workspaceId,
        title: "Remote Work Policy",
        content: `# Remote Work Policy

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
        category: "General",
        last_updated_by: adminProfileId,
      },
    ];
    await db.from("sops").insert(sopInserts);

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

    const taskInserts = taskData.map((task) => ({
      id: uid(),
      workspace_id: workspaceId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      creator_id: adminProfileId,
      assignee_id: allProfileIds[task.assignee_idx + 1], // +1 because allProfileIds[0] is admin
    }));
    await db.from("tasks").insert(taskInserts);

    // --- Courses ---
    const course1Id = uid();
    await db.from("courses").insert({
      id: course1Id,
      workspace_id: workspaceId,
      title: "Welcome to Radia",
      description:
        "Get started with Radia - learn about our company, team structure, and the tools we use.",
      is_mandatory: true,
    });

    const lesson1Inserts = [
      {
        id: uid(),
        course_id: course1Id,
        title: "Company Overview",
        content:
          "Learn about Radia's mission, values, and history. Understand our position in the market and our goals for the future.",
        sort_order: 1,
        estimated_minutes: 5,
      },
      {
        id: uid(),
        course_id: course1Id,
        title: "Team Structure",
        content:
          "Understand how our teams are organized, key roles and responsibilities, and how cross-functional collaboration works.",
        sort_order: 2,
        estimated_minutes: 3,
      },
      {
        id: uid(),
        course_id: course1Id,
        title: "Tools & Access",
        content:
          "Set up your development environment, get access to necessary tools, and learn our workflow processes.",
        sort_order: 3,
        estimated_minutes: 4,
      },
    ];
    await db.from("lessons").insert(lesson1Inserts);

    const course2Id = uid();
    await db.from("courses").insert({
      id: course2Id,
      workspace_id: workspaceId,
      title: "Security & Compliance",
      description:
        "Essential security practices and compliance requirements every team member must know.",
      is_mandatory: true,
    });

    const lesson2Inserts = [
      {
        id: uid(),
        course_id: course2Id,
        title: "Data Security",
        content:
          "Learn about data classification, encryption practices, secure communication, and how to handle sensitive information.",
        sort_order: 1,
        estimated_minutes: 6,
      },
      {
        id: uid(),
        course_id: course2Id,
        title: "Compliance Basics",
        content:
          "Understand regulatory requirements, company policies, audit procedures, and your responsibilities for maintaining compliance.",
        sort_order: 2,
        estimated_minutes: 5,
      },
    ];
    await db.from("lessons").insert(lesson2Inserts);

    return NextResponse.json({ ok: true, message: "Seeded successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
