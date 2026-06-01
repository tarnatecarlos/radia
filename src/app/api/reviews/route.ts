import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

// GET /api/reviews — list review cycles + individual reviews
export async function GET(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const cycleId = url.searchParams.get("cycle_id");
    const type = url.searchParams.get("type"); // "cycles" | "reviews"

    const cyclesQuery = `SELECT rc.*,
       (SELECT COUNT(*) FROM reviews WHERE review_cycle_id = rc.id) as review_count,
       (SELECT COUNT(*) FROM reviews WHERE review_cycle_id = rc.id AND status = 'submitted') as completed_count
     FROM review_cycles rc
     WHERE rc.workspace_id = ?
     ORDER BY rc.start_date DESC`;

    if (type === "cycles") {
      return NextResponse.json(db.prepare(cyclesQuery).all(profile.workspace_id as string));
    }

    // Get individual reviews
    let query = `SELECT r.*,
                   re.first_name as reviewee_first, re.last_name as reviewee_last, re.title as reviewee_title, re.avatar_url as reviewee_avatar,
                   rr.first_name as reviewer_first, rr.last_name as reviewer_last, rr.title as reviewer_title, rr.avatar_url as reviewer_avatar
                 FROM reviews r
                 JOIN profiles re ON re.id = r.reviewee_id
                 JOIN profiles rr ON rr.id = r.reviewer_id
                 JOIN review_cycles rc ON rc.id = r.review_cycle_id
                 WHERE rc.workspace_id = ?`;
    const params: unknown[] = [profile.workspace_id as string];

    if (cycleId) { query += " AND r.review_cycle_id = ?"; params.push(cycleId); }
    query += " ORDER BY r.created_at DESC";

    const reviews = db.prepare(query).all(...params) as Record<string, unknown>[];
    const enriched = reviews.map(r => ({
      ...r,
      reviewee: { first_name: r.reviewee_first, last_name: r.reviewee_last, title: r.reviewee_title, avatar_url: r.reviewee_avatar },
      reviewer: { first_name: r.reviewer_first, last_name: r.reviewer_last, title: r.reviewer_title, avatar_url: r.reviewer_avatar },
    }));

    if (!type) {
      const cycles = db.prepare(cyclesQuery).all(profile.workspace_id as string);
      return NextResponse.json({ cycles, reviews: enriched });
    }

    return NextResponse.json(enriched);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/reviews — create a review cycle or individual review
export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const db = getDb();

    // Create review cycle
    if (body.action === "create_cycle") {
      if (profile.role !== "creator" && profile.role !== "moderator") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const { name, quarter, start_date, end_date } = body;
      if (!name || !quarter || !start_date || !end_date) {
        return NextResponse.json({ error: "name, quarter, start_date, end_date required" }, { status: 400 });
      }
      const id = uid();
      db.prepare(
        `INSERT INTO review_cycles (id, workspace_id, name, quarter, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, profile.workspace_id as string, name, quarter, start_date, end_date);
      const created = db.prepare("SELECT * FROM review_cycles WHERE id = ?").get(id);
      return NextResponse.json(created);
    }

    // Create individual review
    const { review_cycle_id, reviewee_id, reviewer_id } = body;
    if (!review_cycle_id || !reviewee_id) {
      return NextResponse.json({ error: "review_cycle_id and reviewee_id required" }, { status: 400 });
    }
    const id = uid();
    db.prepare(
      `INSERT INTO reviews (id, review_cycle_id, reviewee_id, reviewer_id)
       VALUES (?, ?, ?, ?)`
    ).run(id, review_cycle_id, reviewee_id, reviewer_id || profile.id);
    const created = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
    return NextResponse.json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/reviews — submit feedback + flag skill gaps
export async function PATCH(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const db = getDb();

    // Update cycle status
    if (body.action === "update_cycle") {
      const { id, status } = body;
      if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
      db.prepare("UPDATE review_cycles SET status = ? WHERE id = ? AND workspace_id = ?")
        .run(status, id, profile.workspace_id as string);
      const updated = db.prepare("SELECT * FROM review_cycles WHERE id = ?").get(id);
      return NextResponse.json(updated);
    }

    // Submit review with optional skill gap flagging
    const { id, rating, summary, strengths, improvements, skill_gaps } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const sets: string[] = [];
    const values: unknown[] = [];

    if (rating !== undefined) { sets.push("rating = ?"); values.push(rating); }
    if (summary !== undefined) { sets.push("summary = ?"); values.push(summary); }
    if (strengths !== undefined) { sets.push("strengths = ?"); values.push(strengths); }
    if (improvements !== undefined) { sets.push("improvements = ?"); values.push(improvements); }

    // Mark as submitted if rating provided
    if (rating !== undefined) {
      sets.push("status = 'submitted'");
      sets.push("submitted_at = datetime('now')");
    } else if (sets.length > 0) {
      sets.push("status = 'in_progress'");
    }

    if (sets.length > 0) {
      values.push(id);
      db.prepare(`UPDATE reviews SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    }

    // Process skill gaps → auto-recommend LMS courses (cross-module bridge)
    if (skill_gaps && Array.isArray(skill_gaps) && skill_gaps.length > 0) {
      const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id) as Record<string, unknown>;

      db.transaction(() => {
        for (const gap of skill_gaps) {
          const gapId = uid();

          // Find a course that teaches this skill
          const courseSkill = db.prepare(
            `SELECT cs.course_id FROM course_skills cs
             JOIN courses c ON c.id = cs.course_id
             WHERE cs.skill_id = ? AND c.workspace_id = ?
             LIMIT 1`
          ).get(gap.skill_id, profile.workspace_id as string) as { course_id: string } | undefined;

          db.prepare(
            `INSERT INTO review_skill_gaps (id, review_id, skill_id, recommended_course_id, notes)
             VALUES (?, ?, ?, ?, ?)`
          ).run(gapId, id, gap.skill_id, courseSkill?.course_id ?? null, gap.notes || null);

          // Auto-enroll reviewee in recommended course if one exists
          if (courseSkill && review) {
            const existing = db.prepare(
              "SELECT id FROM course_enrollments WHERE profile_id = ? AND course_id = ?"
            ).get(review.reviewee_id as string, courseSkill.course_id);
            if (!existing) {
              db.prepare(
                `INSERT INTO course_enrollments (id, profile_id, course_id, completed_lessons)
                 VALUES (?, ?, ?, '[]')`
              ).run(uid(), review.reviewee_id as string, courseSkill.course_id);
            }
          }
        }
      })();
    }

    const updated = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
