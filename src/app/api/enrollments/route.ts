import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

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

    const justCompleted = !!(
      completedAt &&
      !(enrollment.completed_at as string | null)
    );

    const runUpdate = db.transaction(() => {
      if (completedAt) {
        db.prepare(
          `UPDATE course_enrollments SET completed_lessons = ?, completed_at = datetime('now') WHERE id = ?`
        ).run(lessonsJson, id);
      } else {
        db.prepare(
          `UPDATE course_enrollments SET completed_lessons = ?, completed_at = NULL WHERE id = ?`
        ).run(lessonsJson, id);
      }

      // Profile enrichment: on course completion, issue certification + update skills
      if (justCompleted) {
        const profileId = enrollment.profile_id as string;

        db.prepare(
          `INSERT OR IGNORE INTO certifications (id, profile_id, course_id, issued_at)
           VALUES (?, ?, ?, datetime('now'))`
        ).run(uid(), profileId, courseId);

        const courseSkills = db.prepare(
          "SELECT skill_id FROM course_skills WHERE course_id = ?"
        ).all(courseId) as { skill_id: string }[];

        for (const cs of courseSkills) {
          db.prepare(
            `UPDATE certifications SET skill_id = ? WHERE profile_id = ? AND course_id = ? AND skill_id IS NULL`
          ).run(cs.skill_id, profileId, courseId);

          const existing = db.prepare(
            "SELECT id, proficiency FROM profile_skills WHERE profile_id = ? AND skill_id = ?"
          ).get(profileId, cs.skill_id) as { id: string; proficiency: string } | undefined;

          if (existing) {
            const levels = ["beginner", "intermediate", "advanced", "expert"];
            if (levels.indexOf(existing.proficiency) < levels.indexOf("intermediate")) {
              db.prepare(
                "UPDATE profile_skills SET proficiency = 'intermediate', source = 'certification', verified_at = datetime('now') WHERE id = ?"
              ).run(existing.id);
            }
          } else {
            db.prepare(
              `INSERT INTO profile_skills (id, profile_id, skill_id, proficiency, source, verified_at)
               VALUES (?, ?, ?, 'intermediate', 'certification', datetime('now'))`
            ).run(uid(), profileId, cs.skill_id);
          }

          db.prepare(
            `UPDATE review_skill_gaps SET resolved = 1
             WHERE skill_id = ? AND review_id IN (
               SELECT id FROM reviews WHERE reviewee_id = ?
             ) AND resolved = 0`
          ).run(cs.skill_id, profileId);
        }
      }
    });
    runUpdate();

    const updated = db
      .prepare("SELECT * FROM course_enrollments WHERE id = ?")
      .get(id) as Record<string, unknown>;

    return NextResponse.json(parseEnrollment(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
