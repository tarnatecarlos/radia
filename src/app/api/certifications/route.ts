import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

// GET /api/certifications — list certifications for a profile or entire workspace
export async function GET(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const profileId = url.searchParams.get("profile_id");

    let query = db
      .from("certifications")
      .select(
        `*,
         courses!inner(title, description),
         skills(name, category),
         profiles!inner(workspace_id)`
      )
      .eq("profiles.workspace_id", profile.workspace_id as string);

    if (profileId) query = query.eq("profile_id", profileId);
    query = query.order("issued_at", { ascending: false });

    const { data: rows, error } = await query;
    if (error) throw error;

    const result = (rows || []).map((r: Record<string, unknown>) => {
      const course = r.courses as { title: string; description: string };
      const skill = r.skills as { name: string; category: string } | null;
      return {
        ...r,
        course: { title: course.title, description: course.description },
        skill: skill ? { name: skill.name, category: skill.category } : null,
        courses: undefined,
        skills: undefined,
        profiles: undefined,
      };
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
