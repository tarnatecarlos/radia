import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const { data: prefs } = await db
      .from("notification_preferences")
      .select("*")
      .eq("profile_id", profile.id as string)
      .maybeSingle();

    if (!prefs) {
      return NextResponse.json(
        { error: "Preferences not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(prefs);
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
    const db = getDb();

    const BOOL_FIELDS = [
      "email_digest",
      "email_mentions",
      "slack_updates",
      "slack_milestones",
      "in_app_all",
      "in_app_tasks",
    ];

    const updateFields: Record<string, unknown> = {};

    for (const field of BOOL_FIELDS) {
      if (field in body) {
        updateFields[field] = !!body[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updated } = await db
      .from("notification_preferences")
      .update(updateFields)
      .eq("profile_id", profile.id as string)
      .select()
      .single();

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
