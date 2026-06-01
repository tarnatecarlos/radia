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
    const rows = db
      .prepare(
        `SELECT t.*,
                p.id as a_id, p.first_name as a_first_name, p.last_name as a_last_name,
                p.email as a_email, p.title as a_title, p.role as a_role, p.avatar_url as a_avatar_url
         FROM tasks t
         LEFT JOIN profiles p ON p.id = t.assignee_id
         WHERE t.workspace_id = ?
         ORDER BY t.updated_at DESC`
      )
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    const tasks = rows.map((row) => {
      const {
        a_id,
        a_first_name,
        a_last_name,
        a_email,
        a_title,
        a_role,
        a_avatar_url,
        ...taskFields
      } = row;
      return {
        ...taskFields,
        assignee: a_id
          ? {
              id: a_id,
              first_name: a_first_name,
              last_name: a_last_name,
              email: a_email,
              title: a_title,
              role: a_role,
              avatar_url: a_avatar_url,
            }
          : null,
      };
    });

    return NextResponse.json(tasks);
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

    const {
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date,
      sop_reference_id,
    } = await request.json();
    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!hasPrivilegedWorkspaceRole(profile.role)) {
      const prefs = getWorkspacePreferences(profile.workspace_id as string);
      if (!prefs.members_can_create_tasks) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }
    const id = uid();
    db.prepare(
      `INSERT INTO tasks (id, workspace_id, title, description, status, priority, creator_id, assignee_id, due_date, sop_reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      profile.workspace_id as string,
      title,
      description || null,
      status || "TODO",
      priority || "MEDIUM",
      profile.id as string,
      assignee_id || null,
      due_date || null,
      sop_reference_id || null
    );

    // Return with assignee joined (same shape as GET)
    const row = db.prepare(
      `SELECT t.*,
              p.id as a_id, p.first_name as a_first_name, p.last_name as a_last_name,
              p.email as a_email, p.title as a_title, p.role as a_role, p.avatar_url as a_avatar_url
       FROM tasks t
       LEFT JOIN profiles p ON p.id = t.assignee_id
       WHERE t.id = ?`
    ).get(id) as Record<string, unknown>;

    const { a_id, a_first_name, a_last_name, a_email, a_title, a_role, a_avatar_url, ...taskFields } = row;
    const task = {
      ...taskFields,
      assignee: a_id ? { id: a_id, first_name: a_first_name, last_name: a_last_name, email: a_email, title: a_title, role: a_role, avatar_url: a_avatar_url } : null,
    };
    return NextResponse.json(task);
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

    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM tasks WHERE id = ? AND workspace_id = ?")
      .get(id, profile.workspace_id as string);
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const allowed = [
      "title",
      "description",
      "status",
      "priority",
      "assignee_id",
      "due_date",
      "sop_reference_id",
      "integration_source",
    ];
    const sets: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];

    for (const key of allowed) {
      if (key in fields) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    values.push(id);
    db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values
    );

    const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
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
      .prepare("SELECT * FROM tasks WHERE id = ? AND workspace_id = ?")
      .get(id, profile.workspace_id as string);
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
