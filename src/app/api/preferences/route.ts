import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";
import { DEFAULT_ALLOWED_INTEGRATIONS, getWorkspacePreferences } from "@/lib/workspace-preferences";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getWorkspacePreferences(profile.workspace_id as string));
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
    await getWorkspacePreferences(profile.workspace_id as string);

    const boolFields = ["members_can_create_tasks", "members_can_create_sops", "members_can_create_courses", "members_can_manage_integrations"];
    const updateObj: Record<string, unknown> = {};

    for (const key of boolFields) {
      if (key in body) {
        if (typeof body[key] !== "boolean") {
          return NextResponse.json({ error: `${key} must be a boolean` }, { status: 400 });
        }
        updateObj[key] = body[key];
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
      updateObj.allowed_integrations = allowedIntegrations;
    }

    if (Object.keys(updateObj).length > 0) {
      await db.from("workspace_preferences").update(updateObj).eq("workspace_id", profile.workspace_id as string);
    }

    return NextResponse.json(await getWorkspacePreferences(profile.workspace_id as string));
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
