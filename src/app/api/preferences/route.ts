import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";
import { DEFAULT_ALLOWED_INTEGRATIONS, getWorkspacePreferences } from "@/lib/workspace-preferences";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(getWorkspacePreferences(profile.workspace_id as string));
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((profile.role as string) !== "creator") {
      return NextResponse.json({ error: "Only workspace creators can update preferences" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const db = getDb();

    // Ensure row exists
    getWorkspacePreferences(profile.workspace_id as string);

    const boolFields = ["members_can_create_tasks", "members_can_create_sops", "members_can_create_courses", "members_can_manage_integrations"];
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const key of boolFields) {
      if (key in body) {
        if (typeof body[key] !== "boolean") {
          return NextResponse.json({ error: `${key} must be a boolean` }, { status: 400 });
        }
        sets.push(`${key} = ?`);
        values.push(body[key] ? 1 : 0);
      }
    }

    if ("allowed_integrations" in body) {
      const allowedIntegrations = body.allowed_integrations;
      if (
        !Array.isArray(allowedIntegrations) ||
        !allowedIntegrations.every(
          (platform) => typeof platform === "string" && DEFAULT_ALLOWED_INTEGRATIONS.includes(platform)
        )
      ) {
        return NextResponse.json({ error: "allowed_integrations contains an unsupported platform" }, { status: 400 });
      }
      sets.push("allowed_integrations = ?");
      values.push(JSON.stringify(allowedIntegrations));
    }

    if (sets.length > 0) {
      values.push(profile.workspace_id as string);
      db.prepare(`UPDATE workspace_preferences SET ${sets.join(", ")} WHERE workspace_id = ?`).run(...values);
    }

    return NextResponse.json(getWorkspacePreferences(profile.workspace_id as string));
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
