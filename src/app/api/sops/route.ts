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
    const { data: sops } = await db
      .from("sops")
      .select("*")
      .eq("workspace_id", profile.workspace_id as string)
      .order("updated_at", { ascending: false });

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
      const prefs = await getWorkspacePreferences(profile.workspace_id as string);
      if (!prefs.members_can_create_sops) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }
    const id = uid();
    const { data: sop } = await db
      .from("sops")
      .insert({
        id,
        workspace_id: profile.workspace_id as string,
        title,
        content: content || "",
        category: category || "General",
        last_updated_by: profile.id as string,
      })
      .select()
      .single();

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
    const { data: existing } = await db
      .from("sops")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    const updateFields: Record<string, unknown> = {
      last_updated_by: profile.id as string,
      version: (existing.version as number) + 1,
    };

    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (category !== undefined) updateFields.category = category;

    const { data: updated } = await db
      .from("sops")
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
      .from("sops")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    await db.from("sops").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
