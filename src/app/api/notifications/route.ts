import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

const BOOL_FIELDS = [
  "email_digest",
  "email_mentions",
  "slack_updates",
  "slack_milestones",
  "in_app_all",
  "in_app_tasks",
];

function convertBooleans(row: Record<string, unknown>) {
  const result = { ...row };
  for (const field of BOOL_FIELDS) {
    if (result[field] !== undefined) {
      result[field] = !!(result[field] as number);
    }
  }
  return result;
}

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const prefs = db
      .prepare(
        "SELECT * FROM notification_preferences WHERE profile_id = ?"
      )
      .get(profile.id as string) as Record<string, unknown> | undefined;

    if (!prefs) {
      return NextResponse.json(
        { error: "Preferences not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(convertBooleans(prefs));
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

    const sets: string[] = [];
    const values: unknown[] = [];

    for (const field of BOOL_FIELDS) {
      if (field in body) {
        sets.push(`${field} = ?`);
        values.push(body[field] ? 1 : 0);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(profile.id as string);
    db.prepare(
      `UPDATE notification_preferences SET ${sets.join(", ")} WHERE profile_id = ?`
    ).run(...values);

    const updated = db
      .prepare(
        "SELECT * FROM notification_preferences WHERE profile_id = ?"
      )
      .get(profile.id as string) as Record<string, unknown>;

    return NextResponse.json(convertBooleans(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
