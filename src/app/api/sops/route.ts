import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";
import { getWorkspacePreferences, hasPrivilegedWorkspaceRole } from "@/lib/workspace-preferences";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const sops = db
      .prepare(
        "SELECT * FROM sops WHERE workspace_id = ? ORDER BY updated_at DESC"
      )
      .all(profile.workspace_id as string);

    return NextResponse.json(sops);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, category } = await request.json();
    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!hasPrivilegedWorkspaceRole(profile.role)) {
      const prefs = getWorkspacePreferences(profile.workspace_id as string);
      if (!prefs.members_can_create_sops) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }
    const id = uid();
    db.prepare(
      `INSERT INTO sops (id, workspace_id, title, content, category, last_updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      profile.workspace_id as string,
      title,
      content || "",
      category || "General",
      profile.id as string
    );

    const sop = db.prepare("SELECT * FROM sops WHERE id = ?").get(id);
    return NextResponse.json(sop);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, content, category } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM sops WHERE id = ? AND workspace_id = ?")
      .get(id, profile.workspace_id as string) as
      | Record<string, unknown>
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    const sets: string[] = [
      "updated_at = datetime('now')",
      "version = version + 1",
      "last_updated_by = ?",
    ];
    const values: unknown[] = [profile.id as string];

    if (title !== undefined) {
      sets.push("title = ?");
      values.push(title);
    }
    if (content !== undefined) {
      sets.push("content = ?");
      values.push(content);
    }
    if (category !== undefined) {
      sets.push("category = ?");
      values.push(category);
    }

    values.push(id);
    db.prepare(`UPDATE sops SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values
    );

    const updated = db.prepare("SELECT * FROM sops WHERE id = ?").get(id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM sops WHERE id = ? AND workspace_id = ?")
      .get(id, profile.workspace_id as string);
    if (!existing) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM sops WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
