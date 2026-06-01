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
    const { data: integrations } = await db
      .from("integrations")
      .select("*")
      .eq("workspace_id", profile.workspace_id as string);

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
      const prefs = await getWorkspacePreferences(profile.workspace_id as string);
      if (!prefs.members_can_manage_integrations) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
      // Check allowed platforms
      const { data: integration } = await db
        .from("integrations")
        .select("platform_name")
        .eq("id", id)
        .maybeSingle();
      if (integration) {
        if (!prefs.allowed_integrations.includes(integration.platform_name)) {
          return NextResponse.json({ error: "This integration is not allowed" }, { status: 403 });
        }
      }
    }

    const { data: existing } = await db
      .from("integrations")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const updateFields: Record<string, unknown> = {};

    if (is_active !== undefined) {
      updateFields.is_active = !!is_active;
    }
    if (config !== undefined) {
      updateFields.config = config;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updated } = await db
      .from("integrations")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
