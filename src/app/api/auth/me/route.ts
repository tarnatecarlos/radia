import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getSessionUser, getProfileByUserId, SESSION_COOKIE } from "@/lib/auth";
import { getWorkspacePreferences } from "@/lib/workspace-preferences";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    const session = getSessionUser(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = getProfileByUserId(session.userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const db = getDb();

    const workspace = db
      .prepare("SELECT * FROM workspaces WHERE id = ?")
      .get(profile.workspace_id as string);

    const serverAdmins = db
      .prepare("SELECT * FROM server_admins WHERE profile_id = ?")
      .all(profile.id as string);

    const integrations = db
      .prepare("SELECT * FROM integrations WHERE workspace_id = ?")
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    const preferences = getWorkspacePreferences(profile.workspace_id as string);

    const result: Record<string, unknown> = {
      profile: {
        ...profile,
        onboarding_completed: !!(profile.onboarding_completed as number),
        setup_completed: !!(profile.setup_completed as number),
      },
      workspace,
      serverAdmins,
      integrations: integrations.map((i) => ({
        ...i,
        is_active: !!(i.is_active as number),
      })),
      preferences,
      profileSkills: [],
      certifications: [],
      activeReviewCycle: null,
    };

    // Only load performance data when requested (avoids hot-path bloat on every page)
    const url = new URL(request.url);
    if (url.searchParams.get("include") === "performance") {
      result.profileSkills = db
        .prepare(
          `SELECT ps.*, s.name as skill_name, s.category as skill_category
           FROM profile_skills ps
           JOIN skills s ON s.id = ps.skill_id
           WHERE ps.profile_id = ?`
        )
        .all(profile.id as string);

      result.certifications = db
        .prepare(
          `SELECT cert.*, c.title as course_title
           FROM certifications cert
           JOIN courses c ON c.id = cert.course_id
           WHERE cert.profile_id = ?`
        )
        .all(profile.id as string);

      result.activeReviewCycle = db
        .prepare(
          `SELECT * FROM review_cycles
           WHERE workspace_id = ? AND status = 'active'
           ORDER BY start_date DESC LIMIT 1`
        )
        .get(profile.workspace_id as string) ?? null;
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
