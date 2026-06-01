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

    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const userId = uid();
    const hash = await hashPassword(password);
    const { error: userErr } = await db
      .from("users")
      .insert({ id: userId, email, password_hash: hash });
    if (userErr) throw new Error(`Failed to create user: ${userErr.message}`);

    const workspaceId = uid();
    const subdomain = `${firstName.toLowerCase()}-${uid().slice(0, 8)}`;
    const { error: wsErr } = await db
      .from("workspaces")
      .insert({ id: workspaceId, name: `${firstName}'s Workspace`, subdomain });
    if (wsErr) throw new Error(`Failed to create workspace: ${wsErr.message}`);

    const profileId = uid();
    const { error: profErr } = await db.from("profiles").insert({
      id: profileId,
      user_id: userId,
      workspace_id: workspaceId,
      email,
      first_name: firstName,
      last_name: lastName,
      role: "creator",
      setup_completed: false,
    });
    if (profErr) throw new Error(`Failed to create profile: ${profErr.message}`);

    const { error: notifErr } = await db
      .from("notification_preferences")
      .insert({ id: uid(), profile_id: profileId });
    if (notifErr) throw new Error(`Failed to create notification preferences: ${notifErr.message}`);

    const platforms = [
      "slack",
      "github",
      "gmail",
      "discord",
      "teams",
      "messenger",
    ];
    const integrationRows = platforms.map((platform) => ({
      id: uid(),
      workspace_id: workspaceId,
      platform_name: platform,
      is_active: false,
    }));
    const { error: intErr } = await db.from("integrations").insert(integrationRows);
    if (intErr) throw new Error(`Failed to create integrations: ${intErr.message}`);

    // Create default workspace preferences
    const { error: wpErr } = await db
      .from("workspace_preferences")
      .insert({ id: uid(), workspace_id: workspaceId });
    if (wpErr) throw new Error(`Failed to create workspace preferences: ${wpErr.message}`);

    const sessionId = await createSession(userId);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionId, sessionCookieOptions());

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
