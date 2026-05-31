import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, uid } from "@/lib/db";
import {
  hashPassword,
  createSession,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "email, password, firstName, and lastName are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const userId = uid();
    const hash = await hashPassword(password);
    db.prepare(
      "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)"
    ).run(userId, email, hash);

    const workspaceId = uid();
    const subdomain = `${firstName.toLowerCase()}-${uid().slice(0, 8)}`;
    db.prepare(
      "INSERT INTO workspaces (id, name, subdomain) VALUES (?, ?, ?)"
    ).run(workspaceId, `${firstName}'s Workspace`, subdomain);

    const profileId = uid();
    db.prepare(
      `INSERT INTO profiles (id, user_id, workspace_id, email, first_name, last_name, role, setup_completed)
       VALUES (?, ?, ?, ?, ?, ?, 'creator', 0)`
    ).run(profileId, userId, workspaceId, email, firstName, lastName);

    db.prepare(
      `INSERT INTO notification_preferences (id, profile_id) VALUES (?, ?)`
    ).run(uid(), profileId);

    const platforms = [
      "slack",
      "github",
      "gmail",
      "discord",
      "teams",
      "messenger",
    ];
    const insertIntegration = db.prepare(
      "INSERT INTO integrations (id, workspace_id, platform_name, is_active) VALUES (?, ?, ?, 0)"
    );
    for (const platform of platforms) {
      insertIntegration.run(uid(), workspaceId, platform);
    }

    // Create default workspace preferences
    db.prepare("INSERT INTO workspace_preferences (id, workspace_id) VALUES (?, ?)").run(uid(), workspaceId);

    const sessionId = createSession(userId);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionId, sessionCookieOptions());

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
