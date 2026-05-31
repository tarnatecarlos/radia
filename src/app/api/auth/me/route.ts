import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getSessionUser, getProfileByUserId, SESSION_COOKIE } from "@/lib/auth";
import { getWorkspacePreferences } from "@/lib/workspace-preferences";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    const session = getSessionUser(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = getProfileByUserId(session.userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const db = getDb();

    const workspace = db
      .prepare("SELECT * FROM workspaces WHERE id = ?")
      .get(profile.workspace_id as string);

    const serverAdmins = db
      .prepare("SELECT * FROM server_admins WHERE profile_id = ?")
      .all(profile.id as string);

    const integrations = db
      .prepare("SELECT * FROM integrations WHERE workspace_id = ?")
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    const preferences = getWorkspacePreferences(profile.workspace_id as string);

    return NextResponse.json({
      profile: {
        ...profile,
        onboarding_completed: !!(profile.onboarding_completed as number),
        setup_completed: !!(profile.setup_completed as number),
      },
      workspace,
      serverAdmins,
      integrations: integrations.map((i) => ({
        ...i,
        is_active: !!(i.is_active as number),
      })),
      preferences,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
