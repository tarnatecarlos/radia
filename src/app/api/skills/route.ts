import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

// GET /api/skills — workspace skills catalog + optionally profile skills
export async function GET(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const profileId = url.searchParams.get("profile_id");

    const skills = db.prepare("SELECT * FROM skills WHERE workspace_id = ? ORDER BY category, name")
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    // Bulk: return all workspace profile skills in one query
    const allProfileSkills = url.searchParams.get("all_profiles") === "true";

    if (allProfileSkills) {
      const profileSkills = db.prepare(
        `SELECT ps.*, s.name as skill_name, s.category as skill_category, ps.profile_id
         FROM profile_skills ps
         JOIN skills s ON s.id = ps.skill_id
         JOIN profiles p ON p.id = ps.profile_id
         WHERE p.workspace_id = ?`
      ).all(profile.workspace_id as string) as Record<string, unknown>[];
      return NextResponse.json({ skills, profileSkills });
    }

    if (profileId) {
      const profileSkills = db.prepare(
        `SELECT ps.*, s.name as skill_name, s.category as skill_category
         FROM profile_skills ps
         JOIN skills s ON s.id = ps.skill_id
         WHERE ps.profile_id = ?`
      ).all(profileId) as Record<string, unknown>[];
      return NextResponse.json({ skills, profileSkills });
    }

    return NextResponse.json({ skills });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/skills — create a skill or assign skill to profile
export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const db = getDb();

    // Assign skill to profile
    if (body.action === "assign") {
      const { profile_id, skill_id, proficiency, source } = body;
      if (!profile_id || !skill_id) {
        return NextResponse.json({ error: "profile_id and skill_id required" }, { status: 400 });
      }
      const id = uid();
      db.prepare(
        `INSERT OR REPLACE INTO profile_skills (id, profile_id, skill_id, proficiency, source, verified_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      ).run(id, profile_id, skill_id, proficiency || "beginner", source || "manual");
      const row = db.prepare("SELECT * FROM profile_skills WHERE id = ?").get(id);
      return NextResponse.json(row);
    }

    // Create workspace skill
    const { name, category } = body;
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const id = uid();
    db.prepare("INSERT INTO skills (id, workspace_id, name, category) VALUES (?, ?, ?, ?)")
      .run(id, profile.workspace_id as string, name, category || "General");

    const created = db.prepare("SELECT * FROM skills WHERE id = ?").get(id);
    return NextResponse.json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/skills — remove a skill from the catalog
export async function DELETE(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (profile.role !== "creator" && profile.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const db = getDb();
    db.prepare("DELETE FROM skills WHERE id = ? AND workspace_id = ?").run(id, profile.workspace_id as string);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
