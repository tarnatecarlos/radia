import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
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
      .prepare("SELECT * FROM integrations WHERE workspace_id = ?")
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    const integrations = rows.map((row) => ({
      ...row,
      is_active: !!(row.is_active as number),
      config: JSON.parse((row.config as string) || "{}"),
    }));

    return NextResponse.json(integrations);
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
    const { id, is_active, config } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getDb();

    if (!hasPrivilegedWorkspaceRole(profile.role)) {
      const prefs = getWorkspacePreferences(profile.workspace_id as string);
      if (!prefs.members_can_manage_integrations) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
      // Check allowed platforms
      const integration = db.prepare("SELECT platform_name FROM integrations WHERE id = ?").get(id) as { platform_name: string } | undefined;
      if (integration) {
        if (!prefs.allowed_integrations.includes(integration.platform_name)) {
          return NextResponse.json({ error: "This integration is not allowed" }, { status: 403 });
        }
      }
    }
    const existing = db
      .prepare(
        "SELECT * FROM integrations WHERE id = ? AND workspace_id = ?"
      )
      .get(id, profile.workspace_id as string);

    if (!existing) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const sets: string[] = [];
    const values: unknown[] = [];

    if (is_active !== undefined) {
      sets.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (config !== undefined) {
      sets.push("config = ?");
      values.push(JSON.stringify(config));
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(id);
    db.prepare(`UPDATE integrations SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values
    );

    const updated = db
      .prepare("SELECT * FROM integrations WHERE id = ?")
      .get(id) as Record<string, unknown>;

    return NextResponse.json({
      ...updated,
      is_active: !!(updated.is_active as number),
      config: JSON.parse((updated.config as string) || "{}"),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
