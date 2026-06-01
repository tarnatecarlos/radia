import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getSessionUser, getProfileByUserId, SESSION_COOKIE } from "@/lib/auth";
import { getWorkspacePreferences } from "@/lib/workspace-preferences";

/**
 * GET /api/dashboard — single consolidated endpoint for the entire dashboard.
 * Returns auth context (profile, workspace, admins, integrations, preferences)
 * PLUS dashboard data (profiles, tasks, sops, courses, enrollments).
 * Eliminates the /auth/me → /dashboard waterfall.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    const session = await getSessionUser(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileByUserId(session.userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const db = getDb();
    const wsId = profile.workspace_id as string;
    const profileId = profile.id as string;

    // Run ALL queries in one parallel batch — auth context + dashboard data
    const [
      workspaceRes,
      adminsRes,
      integrationsRes,
      preferences,
      profilesRes,
      tasksRes,
      sopsRes,
      coursesRes,
      enrollmentsRes,
    ] = await Promise.all([
      db.from("workspaces").select("*").eq("id", wsId).single(),
      db.from("server_admins").select("*").eq("profile_id", profileId),
      db.from("integrations").select("*").eq("workspace_id", wsId),
      getWorkspacePreferences(wsId),
      db.from("profiles").select("*").eq("workspace_id", wsId),
      db.from("tasks")
        .select("*, assignee:profiles!assignee_id(id, first_name, last_name, email, title, role, avatar_url)")
        .eq("workspace_id", wsId)
        .order("updated_at", { ascending: false }),
      db.from("sops").select("id").eq("workspace_id", wsId),
      db.from("courses").select("*, lessons(*)").eq("workspace_id", wsId),
      db.from("course_enrollments").select("*").eq("profile_id", profileId),
    ]);

    return NextResponse.json({
      // Auth context (same shape as /auth/me)
      auth: {
        profile,
        workspace: workspaceRes.data,
        serverAdmins: adminsRes.data ?? [],
        integrations: integrationsRes.data ?? [],
        preferences,
        profileSkills: [],
        certifications: [],
        activeReviewCycle: null,
      },
      // Dashboard data
      profiles: profilesRes.data ?? [],
      tasks: tasksRes.data ?? [],
      sops: sopsRes.data ?? [],
      courses: coursesRes.data ?? [],
      enrollments: enrollmentsRes.data ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
