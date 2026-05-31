import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, uid } from "@/lib/db";
import { getSessionUser, getProfileByUserId, SESSION_COOKIE } from "@/lib/auth";

async function getAuthProfile() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const session = getSessionUser(sessionId);
  if (!session) return null;
  const profile = getProfileByUserId(session.userId);
  if (!profile) return null;
  return profile;
}

function parseEnrollment(row: Record<string, unknown>) {
  return {
    ...row,
    completed_lessons: JSON.parse(
      (row.completed_lessons as string) || "[]"
    ),
  };
}

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM course_enrollments WHERE profile_id = ?")
      .all(profile.id as string) as Record<string, unknown>[];

    return NextResponse.json(rows.map(parseEnrollment));
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

    const { course_id, completed_lessons } = await request.json();
    if (!course_id) {
      return NextResponse.json(
        { error: "course_id is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = uid();
    const lessonsJson = JSON.stringify(completed_lessons || []);
    db.prepare(
      `INSERT INTO course_enrollments (id, profile_id, course_id, completed_lessons)
       VALUES (?, ?, ?, ?)`
    ).run(id, profile.id as string, course_id, lessonsJson);

    const row = db
      .prepare("SELECT * FROM course_enrollments WHERE id = ?")
      .get(id) as Record<string, unknown>;

    return NextResponse.json(parseEnrollment(row));
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

    const { id, completed_lessons } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare(
        "SELECT * FROM course_enrollments WHERE id = ? AND profile_id = ?"
      )
      .get(id, profile.id as string);

    if (!existing) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    const lessonsJson = JSON.stringify(completed_lessons || []);

    // Check if all lessons in the course are completed
    const enrollment = existing as Record<string, unknown>;
    const courseId = enrollment.course_id as string;
    const totalLessons = db
      .prepare("SELECT COUNT(*) as count FROM lessons WHERE course_id = ?")
      .get(courseId) as { count: number };

    const completedAt =
      completed_lessons &&
      completed_lessons.length >= totalLessons.count &&
      totalLessons.count > 0
        ? "datetime('now')"
        : null;

    if (completedAt) {
      db.prepare(
        `UPDATE course_enrollments SET completed_lessons = ?, completed_at = datetime('now') WHERE id = ?`
      ).run(lessonsJson, id);
    } else {
      db.prepare(
        `UPDATE course_enrollments SET completed_lessons = ?, completed_at = NULL WHERE id = ?`
      ).run(lessonsJson, id);
    }

    const updated = db
      .prepare("SELECT * FROM course_enrollments WHERE id = ?")
      .get(id) as Record<string, unknown>;

    return NextResponse.json(parseEnrollment(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
