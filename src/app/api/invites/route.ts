import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, uid } from "@/lib/db";
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

export async function GET() {
  try {
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
