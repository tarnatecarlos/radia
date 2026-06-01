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

    const { data: workspace } = await db
      .from("workspaces")
      .select("*")
      .eq("id", profile.workspace_id as string)
      .single();

    const { data: serverAdmins } = await db
      .from("server_admins")
      .select("*")
      .eq("profile_id", profile.id as string);

    const { data: integrations } = await db
      .from("integrations")
      .select("*")
      .eq("workspace_id", profile.workspace_id as string);

    const preferences = await getWorkspacePreferences(profile.workspace_id as string);

    const result: Record<string, unknown> = {
      profile,
      workspace,
      serverAdmins: serverAdmins ?? [],
      integrations: integrations ?? [],
      preferences,
      profileSkills: [],
      certifications: [],
      activeReviewCycle: null,
    };

    // Only load performance data when requested (avoids hot-path bloat on every page)
    const url = new URL(request.url);
    if (url.searchParams.get("include") === "performance") {
      const { data: profileSkills } = await db
        .from("profile_skills")
        .select("*, skills!inner(name, category)")
        .eq("profile_id", profile.id as string);

      // Flatten the joined skill fields to match the old SQL alias shape
      result.profileSkills = (profileSkills ?? []).map((ps: Record<string, unknown>) => {
        const skill = ps.skills as Record<string, unknown> | null;
        return {
          ...ps,
          skill_name: skill?.name ?? null,
          skill_category: skill?.category ?? null,
          skills: undefined,
        };
      });

      const { data: certifications } = await db
        .from("certifications")
        .select("*, courses!inner(title)")
        .eq("profile_id", profile.id as string);

      result.certifications = (certifications ?? []).map((cert: Record<string, unknown>) => {
        const course = cert.courses as Record<string, unknown> | null;
        return {
          ...cert,
          course_title: course?.title ?? null,
          courses: undefined,
        };
      });

      const { data: activeReviewCycle } = await db
        .from("review_cycles")
        .select("*")
        .eq("workspace_id", profile.workspace_id as string)
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      result.activeReviewCycle = activeReviewCycle ?? null;
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
