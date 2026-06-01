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
    const { data: tasks } = await db
      .from("tasks")
      .select("*, assignee:profiles!assignee_id(id, first_name, last_name, email, title, role, avatar_url)")
      .eq("workspace_id", profile.workspace_id as string)
      .order("updated_at", { ascending: false });

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
      const prefs = await getWorkspacePreferences(profile.workspace_id as string);
      if (!prefs.members_can_create_tasks) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }
    const id = uid();
    await db.from("tasks").insert({
      id,
      workspace_id: profile.workspace_id as string,
      title,
      description: description || null,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      creator_id: profile.id as string,
      assignee_id: assignee_id || null,
      due_date: due_date || null,
      sop_reference_id: sop_reference_id || null,
    });

    // Return with assignee joined (same shape as GET)
    const { data: task } = await db
      .from("tasks")
      .select("*, assignee:profiles!assignee_id(id, first_name, last_name, email, title, role, avatar_url)")
      .eq("id", id)
      .single();

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
    const { data: existing } = await db
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string)
      .maybeSingle();
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
    const updateFields: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in fields) {
        updateFields[key] = fields[key];
      }
    }

    const { data: updated } = await db
      .from("tasks")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

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
    const { data: existing } = await db
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.from("tasks").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
