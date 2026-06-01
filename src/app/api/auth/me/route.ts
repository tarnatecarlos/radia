import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getSessionUser, getProfileByUserId, SESSION_COOKIE } from "@/lib/auth";
import { getWorkspacePreferences } from "@/lib/workspace-preferences";

export async function GET(request: NextRequest) {
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

    // Run all 4 queries in parallel instead of sequentially
    const [workspaceRes, adminsRes, integrationsRes, preferences] = await Promise.all([
      db.from("workspaces").select("*").eq("id", wsId).single(),
      db.from("server_admins").select("*").eq("profile_id", profileId),
      db.from("integrations").select("*").eq("workspace_id", wsId),
      getWorkspacePreferences(wsId),
    ]);

    const result: Record<string, unknown> = {
      profile,
      workspace: workspaceRes.data,
      serverAdmins: adminsRes.data ?? [],
      integrations: integrationsRes.data ?? [],
      preferences,
      profileSkills: [],
      certifications: [],
      activeReviewCycle: null,
    };

    const url = new URL(request.url);
    if (url.searchParams.get("include") === "performance") {
      // Run performance queries in parallel too
      const [skillsRes, certsRes, cycleRes] = await Promise.all([
        db.from("profile_skills").select("*, skills!inner(name, category)").eq("profile_id", profileId),
        db.from("certifications").select("*, courses!inner(title)").eq("profile_id", profileId),
        db.from("review_cycles").select("*").eq("workspace_id", wsId).eq("status", "active").order("start_date", { ascending: false }).limit(1).maybeSingle(),
      ]);

      result.profileSkills = (skillsRes.data ?? []).map((ps: Record<string, unknown>) => {
        const skill = ps.skills as Record<string, unknown> | null;
        return { ...ps, skill_name: skill?.name ?? null, skill_category: skill?.category ?? null, skills: undefined };
      });

      result.certifications = (certsRes.data ?? []).map((cert: Record<string, unknown>) => {
        const course = cert.courses as Record<string, unknown> | null;
        return { ...cert, course_title: course?.title ?? null, courses: undefined };
      });

      result.activeReviewCycle = cycleRes.data ?? null;
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
