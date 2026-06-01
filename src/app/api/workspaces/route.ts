import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can update workspaces" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowed = ["name", "subdomain", "logo_url"];
    const updateFields: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body) {
        updateFields[key] = body[key];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const db = getDb();
    const { data: updated } = await db
      .from("workspaces")
      .update(updateFields)
      .eq("id", profile.workspace_id as string)
      .select()
      .single();

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can delete workspaces" },
        { status: 403 }
      );
    }

    const db = getDb();
    await db.from("workspaces").delete().eq("id", profile.workspace_id as string);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
