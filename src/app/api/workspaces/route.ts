import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getSessionUser, getProfileByUserId, SESSION_COOKIE } from "@/lib/auth";

async function getAuthProfile() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const session = getSessionUser(sessionId);
  if (!session) return null;
  const profile = getProfileByUserId(session.userId);
  if (!profile) return null;
  return profile;
}

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
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const key of allowed) {
      if (key in body) {
        sets.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const db = getDb();
    values.push(profile.workspace_id as string);
    db.prepare(`UPDATE workspaces SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values
    );

    const updated = db
      .prepare("SELECT * FROM workspaces WHERE id = ?")
      .get(profile.workspace_id as string);

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
    db.prepare("DELETE FROM workspaces WHERE id = ?").run(
      profile.workspace_id as string
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
