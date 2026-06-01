import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

// GET /api/objectives — list objectives, optionally filtered by profile or cycle
export async function GET(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const profileId = url.searchParams.get("profile_id");
    const cycleId = url.searchParams.get("cycle_id");

    let query = db
      .from("objectives")
      .select("*, profiles!inner(first_name, last_name, title, avatar_url)")
      .eq("workspace_id", profile.workspace_id as string);

    if (profileId) query = query.eq("profile_id", profileId);
    if (cycleId) query = query.eq("review_cycle_id", cycleId);
    query = query.order("created_at", { ascending: false });

    const { data: rows, error } = await query;
    if (error) throw error;

    const result = (rows || []).map((r: Record<string, unknown>) => {
      const p = r.profiles as { first_name: string; last_name: string; title: string; avatar_url: string };
      return {
        ...r,
        owner: { first_name: p.first_name, last_name: p.last_name, title: p.title, avatar_url: p.avatar_url },
        profiles: undefined,
      };
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/objectives — create an OKR
export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { profile_id, review_cycle_id, title, description, metric, target_value } = await request.json();
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const db = getDb();
    const id = uid();
    const { data: created, error } = await db
      .from("objectives")
      .insert({
        id,
        workspace_id: profile.workspace_id as string,
        profile_id: profile_id || profile.id,
        review_cycle_id: review_cycle_id || null,
        title,
        description: description || null,
        metric: metric || null,
        target_value: target_value ?? null,
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

// PATCH /api/objectives — update progress or status
export async function PATCH(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const db = getDb();
    const allowed = ["title", "description", "metric", "target_value", "current_value", "status", "review_cycle_id"];
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const key of allowed) {
      if (key in fields) updatePayload[key] = fields[key];
    }

    const { data: updated, error } = await db
      .from("objectives")
      .update(updatePayload)
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/objectives
export async function DELETE(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const db = getDb();
    const { error } = await db
      .from("objectives")
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
