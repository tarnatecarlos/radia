import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const url = new URL(request.url);
    const fields = url.searchParams.get("fields");

    let rows: Record<string, unknown>[];
    if (fields) {
      const allowed = [
        "id",
        "user_id",
        "workspace_id",
        "email",
        "first_name",
        "last_name",
        "role",
        "title",
        "manager_id",
        "onboarding_completed",
        "setup_completed",
        "started_date",
        "avatar_url",
        "created_at",
      ];
      const selected = fields
        .split(",")
        .map((f) => f.trim())
        .filter((f) => allowed.includes(f));
      if (selected.length === 0) {
        return NextResponse.json(
          { error: "No valid fields specified" },
          { status: 400 }
        );
      }
      rows = db
        .prepare(
          `SELECT ${selected.join(", ")} FROM profiles WHERE workspace_id = ?`
        )
        .all(profile.workspace_id as string) as Record<string, unknown>[];
    } else {
      rows = db
        .prepare("SELECT * FROM profiles WHERE workspace_id = ?")
        .all(profile.workspace_id as string) as Record<string, unknown>[];
    }

    const result = rows.map((r) => ({
      ...r,
      ...(r.onboarding_completed !== undefined && {
        onboarding_completed: !!(r.onboarding_completed as number),
      }),
      ...(r.setup_completed !== undefined && {
        setup_completed: !!(r.setup_completed as number),
      }),
    }));

    return NextResponse.json(result);
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

    const { email, first_name, last_name, role, title, manager_id } =
      await request.json();
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: "email, first_name, and last_name are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const newId = uid();
    db.prepare(
      `INSERT INTO profiles (id, workspace_id, email, first_name, last_name, role, title, manager_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      newId,
      profile.workspace_id as string,
      email,
      first_name,
      last_name,
      role || "user",
      title || null,
      manager_id || null
    );

    db.prepare(
      "INSERT INTO notification_preferences (id, profile_id) VALUES (?, ?)"
    ).run(uid(), newId);

    // ── Automated Onboarding: auto-enroll in all mandatory courses ──
    const mandatoryCourses = db.prepare(
      "SELECT id FROM courses WHERE workspace_id = ? AND is_mandatory = 1"
    ).all(profile.workspace_id as string) as { id: string }[];

    for (const course of mandatoryCourses) {
      const enrollId = uid();
      db.prepare(
        `INSERT OR IGNORE INTO course_enrollments (id, profile_id, course_id, completed_lessons)
         VALUES (?, ?, ?, '[]')`
      ).run(enrollId, newId, course.id);
    }

    const created = db.prepare("SELECT * FROM profiles WHERE id = ?").get(newId) as Record<string, unknown>;
    return NextResponse.json({
      ...created,
      onboarding_completed: !!(created.onboarding_completed as number),
      setup_completed: !!(created.setup_completed as number),
      auto_enrolled_courses: mandatoryCourses.length,
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

    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const target = db
      .prepare("SELECT * FROM profiles WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;

    if (!target) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Users can only update their own profile; creators/moderators can update any in workspace
    const isSelf = target.id === profile.id;
    const isPrivileged =
      (profile.role === "creator" || profile.role === "moderator") &&
      target.workspace_id === profile.workspace_id;
    if (!isSelf && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowed = [
      "first_name",
      "last_name",
      "title",
      "role",
      "manager_id",
      "onboarding_completed",
      "setup_completed",
      "avatar_url",
      "email",
    ];
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const key of allowed) {
      if (key in fields) {
        sets.push(`${key} = ?`);
        // Convert booleans to integers for SQLite
        if (key === "onboarding_completed" || key === "setup_completed") {
          values.push(fields[key] ? 1 : 0);
        } else {
          values.push(fields[key]);
        }
      }
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(id);
    db.prepare(`UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values
    );

    const updated = db
      .prepare("SELECT * FROM profiles WHERE id = ?")
      .get(id) as Record<string, unknown>;

    return NextResponse.json({
      ...updated,
      onboarding_completed: !!(updated.onboarding_completed as number),
      setup_completed: !!(updated.setup_completed as number),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
