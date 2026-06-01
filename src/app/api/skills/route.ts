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

    const { data: skills, error: skillsErr } = await db
      .from("skills")
      .select("*")
      .eq("workspace_id", profile.workspace_id as string)
      .order("category")
      .order("name");

    if (skillsErr) throw skillsErr;

    // Bulk: return all workspace profile skills in one query
    const allProfileSkills = url.searchParams.get("all_profiles") === "true";

    if (allProfileSkills) {
      const { data: profileSkills, error: psErr } = await db
        .from("profile_skills")
        .select("*, skills!inner(name, category), profiles!inner(workspace_id)")
        .eq("profiles.workspace_id", profile.workspace_id as string);

      if (psErr) throw psErr;

      const mapped = (profileSkills || []).map((ps: Record<string, unknown>) => {
        const skill = ps.skills as { name: string; category: string };
        return {
          ...ps,
          skill_name: skill.name,
          skill_category: skill.category,
          skills: undefined,
          profiles: undefined,
        };
      });
      return NextResponse.json({ skills, profileSkills: mapped });
    }

    if (profileId) {
      const { data: profileSkills, error: psErr } = await db
        .from("profile_skills")
        .select("*, skills!inner(name, category)")
        .eq("profile_id", profileId);

      if (psErr) throw psErr;

      const mapped = (profileSkills || []).map((ps: Record<string, unknown>) => {
        const skill = ps.skills as { name: string; category: string };
        return {
          ...ps,
          skill_name: skill.name,
          skill_category: skill.category,
          skills: undefined,
        };
      });
      return NextResponse.json({ skills, profileSkills: mapped });
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
      const { data: row, error } = await db
        .from("profile_skills")
        .upsert(
          {
            id,
            profile_id,
            skill_id,
            proficiency: proficiency || "beginner",
            source: source || "manual",
            verified_at: new Date().toISOString(),
          },
          { onConflict: "profile_id,skill_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(row);
    }

    // Create workspace skill
    const { name, category } = body;
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const id = uid();
    const { data: created, error } = await db
      .from("skills")
      .insert({
        id,
        workspace_id: profile.workspace_id as string,
        name,
        category: category || "General",
      })
      .select()
      .single();

    if (error) throw error;
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
    const { error } = await db
      .from("skills")
      .delete()
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
