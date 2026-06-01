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

    let query = `SELECT o.*, p.first_name, p.last_name, p.title as job_title, p.avatar_url
                 FROM objectives o
                 JOIN profiles p ON p.id = o.profile_id
                 WHERE o.workspace_id = ?`;
    const params: unknown[] = [profile.workspace_id as string];

    if (profileId) { query += " AND o.profile_id = ?"; params.push(profileId); }
    if (cycleId) { query += " AND o.review_cycle_id = ?"; params.push(cycleId); }
    query += " ORDER BY o.created_at DESC";

    const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
    const result = rows.map(r => ({
      ...r,
      owner: { first_name: r.first_name, last_name: r.last_name, title: r.job_title, avatar_url: r.avatar_url },
    }));
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
    db.prepare(
      `INSERT INTO objectives (id, workspace_id, profile_id, review_cycle_id, title, description, metric, target_value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, profile.workspace_id as string, profile_id || profile.id, review_cycle_id || null, title, description || null, metric || null, target_value ?? null);

    const created = db.prepare("SELECT * FROM objectives WHERE id = ?").get(id);
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
    const sets: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];

    for (const key of allowed) {
      if (key in fields) { sets.push(`${key} = ?`); values.push(fields[key]); }
    }

    values.push(id, profile.workspace_id as string);
    db.prepare(`UPDATE objectives SET ${sets.join(", ")} WHERE id = ? AND workspace_id = ?`).run(...values);

    const updated = db.prepare("SELECT * FROM objectives WHERE id = ?").get(id);
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
    db.prepare("DELETE FROM objectives WHERE id = ? AND workspace_id = ?").run(id, profile.workspace_id as string);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
