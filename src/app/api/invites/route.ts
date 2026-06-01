import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    // Public token validation endpoint (no auth needed)
    if (token) {
      const db = getDb();
      const invite = db
        .prepare(
          `SELECT i.*, w.name as workspace_name FROM invites i
           JOIN workspaces w ON w.id = i.workspace_id
           WHERE i.token = ?`
        )
        .get(token) as Record<string, unknown> | undefined;

      if (!invite) {
        return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
      }

      const expired = !!(invite.accepted_at) || new Date(invite.expires_at as string) <= new Date();
      return NextResponse.json({
        workspace_name: invite.workspace_name,
        email: invite.email || null,
        role: invite.role,
        expired,
      });
    }

    // Authenticated list of workspace invites
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const invites = db
      .prepare(
        "SELECT * FROM invites WHERE workspace_id = ? AND accepted_at IS NULL ORDER BY created_at DESC"
      )
      .all(profile.workspace_id as string);

    return NextResponse.json(invites);
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

    const body = await request.json();
    const { email, role } = body;

    const db = getDb();
    const id = uid();
    const token = uid();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    db.prepare(
      `INSERT INTO invites (id, workspace_id, email, token, role, invited_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      profile.workspace_id as string,
      email || null,
      token,
      role || "user",
      profile.id as string,
      expiresAt
    );

    return NextResponse.json({
      token,
      inviteUrl: `/invite/${token}`,
    });
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

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const invite = db
      .prepare(
        "SELECT * FROM invites WHERE token = ? AND accepted_at IS NULL AND expires_at > datetime('now')"
      )
      .get(token) as Record<string, unknown> | undefined;

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    // Move the current user's profile to the invite's workspace
    db.prepare(
      "UPDATE profiles SET workspace_id = ?, role = ? WHERE id = ?"
    ).run(
      invite.workspace_id as string,
      invite.role as string,
      profile.id as string
    );

    // Mark invite as accepted
    db.prepare(
      "UPDATE invites SET accepted_at = datetime('now') WHERE id = ?"
    ).run(invite.id as string);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
