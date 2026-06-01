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

    let query = `SELECT cert.*,
                   c.title as course_title, c.description as course_description,
                   s.name as skill_name, s.category as skill_category
                 FROM certifications cert
                 JOIN courses c ON c.id = cert.course_id
                 LEFT JOIN skills s ON s.id = cert.skill_id
                 JOIN profiles p ON p.id = cert.profile_id
                 WHERE p.workspace_id = ?`;
    const params: unknown[] = [profile.workspace_id as string];

    if (profileId) { query += " AND cert.profile_id = ?"; params.push(profileId); }
    query += " ORDER BY cert.issued_at DESC";

    const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
    const result = rows.map(r => ({
      ...r,
      course: { title: r.course_title, description: r.course_description },
      skill: r.skill_name ? { name: r.skill_name, category: r.skill_category } : null,
    }));
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
