import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";
import { getWorkspacePreferences, hasPrivilegedWorkspaceRole } from "@/lib/workspace-preferences";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const courses = db
      .prepare("SELECT * FROM courses WHERE workspace_id = ?")
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    const allLessons = db
      .prepare(
        `SELECT l.* FROM lessons l
         JOIN courses c ON c.id = l.course_id
         WHERE c.workspace_id = ?
         ORDER BY l.sort_order ASC`
      )
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    const lessonsByCourse = new Map<string, Record<string, unknown>[]>();
    for (const lesson of allLessons) {
      const cid = lesson.course_id as string;
      if (!lessonsByCourse.has(cid)) lessonsByCourse.set(cid, []);
      lessonsByCourse.get(cid)!.push(lesson);
    }

    const result = courses.map((course) => ({
      ...course,
      is_mandatory: !!(course.is_mandatory as number),
      lessons: lessonsByCourse.get(course.id as string) ?? [],
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

    const db = getDb();
    if (!hasPrivilegedWorkspaceRole(profile.role)) {
      const prefs = getWorkspacePreferences(profile.workspace_id as string);
      if (!prefs.members_can_create_courses) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    const { title, description, is_mandatory, lessons } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const courseId = uid();
    db.prepare(
      `INSERT INTO courses (id, workspace_id, title, description, is_mandatory)
       VALUES (?, ?, ?, ?, ?)`
    ).run(courseId, profile.workspace_id as string, title, description || null, is_mandatory ? 1 : 0);

    // Insert lessons if provided
    if (Array.isArray(lessons) && lessons.length > 0) {
      const insertLesson = db.prepare(
        `INSERT INTO lessons (id, course_id, title, content, sort_order, estimated_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        insertLesson.run(
          uid(),
          courseId,
          lesson.title || `Lesson ${i + 1}`,
          lesson.content || "",
          lesson.sort_order ?? i + 1,
          lesson.estimated_minutes ?? 5
        );
      }
    }

    // Return course with lessons
    const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(courseId) as Record<string, unknown>;
    const courseLessons = db.prepare("SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC").all(courseId);

    return NextResponse.json({
      ...course,
      is_mandatory: !!(course.is_mandatory as number),
      lessons: courseLessons,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT * FROM courses WHERE id = ? AND workspace_id = ?").get(id, profile.workspace_id as string);
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM courses WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
