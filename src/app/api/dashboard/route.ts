import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const wsId = profile.workspace_id as string;
    const profileId = profile.id as string;

    // Run ALL dashboard queries in a single parallel batch
    const [profilesRes, tasksRes, sopsRes, coursesRes, enrollmentsRes] = await Promise.all([
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
