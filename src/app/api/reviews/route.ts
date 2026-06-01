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

    if (type === "cycles") {
      const { data: cycles, error } = await db
        .from("review_cycles")
        .select("*, reviews(id, status)")
        .eq("workspace_id", profile.workspace_id as string)
        .order("start_date", { ascending: false });

      if (error) throw error;

      const result = (cycles || []).map((rc: Record<string, unknown>) => {
        const reviews = (rc.reviews || []) as { id: string; status: string }[];
        return {
          ...rc,
          review_count: reviews.length,
          completed_count: reviews.filter((r) => r.status === "submitted").length,
          reviews: undefined,
        };
      });
      return NextResponse.json(result);
    }

    // Get individual reviews with profile joins via nested select
    let query = db
      .from("reviews")
      .select(
        `*,
         reviewee:profiles!reviews_reviewee_id_fkey(first_name, last_name, title, avatar_url),
         reviewer:profiles!reviews_reviewer_id_fkey(first_name, last_name, title, avatar_url),
         review_cycle:review_cycles!inner(workspace_id)`
      )
      .eq("review_cycle.workspace_id", profile.workspace_id as string);

    if (cycleId) {
      query = query.eq("review_cycle_id", cycleId);
    }
    query = query.order("created_at", { ascending: false });

    const { data: reviews, error: revErr } = await query;
    if (revErr) throw revErr;

    // Clean up nested review_cycle from response
    const enriched = (reviews || []).map((r: Record<string, unknown>) => ({
      ...r,
      review_cycle: undefined,
    }));

    if (!type) {
      // Also return cycles
      const { data: cycles, error: cycErr } = await db
        .from("review_cycles")
        .select("*, reviews(id, status)")
        .eq("workspace_id", profile.workspace_id as string)
        .order("start_date", { ascending: false });

      if (cycErr) throw cycErr;

      const cycleResult = (cycles || []).map((rc: Record<string, unknown>) => {
        const revs = (rc.reviews || []) as { id: string; status: string }[];
        return {
          ...rc,
          review_count: revs.length,
          completed_count: revs.filter((r) => r.status === "submitted").length,
          reviews: undefined,
        };
      });
      return NextResponse.json({ cycles: cycleResult, reviews: enriched });
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
      const { data: created, error } = await db
        .from("review_cycles")
        .insert({
          id,
          workspace_id: profile.workspace_id as string,
          name,
          quarter,
          start_date,
          end_date,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(created);
    }

    // Create individual review
    const { review_cycle_id, reviewee_id, reviewer_id } = body;
    if (!review_cycle_id || !reviewee_id) {
      return NextResponse.json({ error: "review_cycle_id and reviewee_id required" }, { status: 400 });
    }
    const id = uid();
    const { data: created, error } = await db
      .from("reviews")
      .insert({
        id,
        review_cycle_id,
        reviewee_id,
        reviewer_id: reviewer_id || profile.id,
      })
      .select()
      .single();

    if (error) throw error;
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

      const { data: updated, error } = await db
        .from("review_cycles")
        .update({ status })
        .eq("id", id)
        .eq("workspace_id", profile.workspace_id as string)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(updated);
    }

    // Submit review with optional skill gap flagging
    const { id, rating, summary, strengths, improvements, skill_gaps } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const updatePayload: Record<string, unknown> = {};

    if (rating !== undefined) updatePayload.rating = rating;
    if (summary !== undefined) updatePayload.summary = summary;
    if (strengths !== undefined) updatePayload.strengths = strengths;
    if (improvements !== undefined) updatePayload.improvements = improvements;

    // Mark as submitted if rating provided
    if (rating !== undefined) {
      updatePayload.status = "submitted";
      updatePayload.submitted_at = new Date().toISOString();
    } else if (Object.keys(updatePayload).length > 0) {
      updatePayload.status = "in_progress";
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: upErr } = await db
        .from("reviews")
        .update(updatePayload)
        .eq("id", id);

      if (upErr) throw upErr;
    }

    // Process skill gaps → auto-recommend LMS courses (cross-module bridge)
    if (skill_gaps && Array.isArray(skill_gaps) && skill_gaps.length > 0) {
      const { data: review } = await db
        .from("reviews")
        .select("*")
        .eq("id", id)
        .single();

      for (const gap of skill_gaps) {
        const gapId = uid();

        // Find a course that teaches this skill
        const { data: courseSkill } = await db
          .from("course_skills")
          .select("course_id, courses!inner(workspace_id)")
          .eq("skill_id", gap.skill_id)
          .eq("courses.workspace_id", profile.workspace_id as string)
          .limit(1)
          .maybeSingle();

        await db.from("review_skill_gaps").insert({
          id: gapId,
          review_id: id,
          skill_id: gap.skill_id,
          recommended_course_id: courseSkill?.course_id ?? null,
          notes: gap.notes || null,
        });

        // Auto-enroll reviewee in recommended course if one exists
        if (courseSkill && review) {
          const { data: existingEnrollment } = await db
            .from("course_enrollments")
            .select("id")
            .eq("profile_id", review.reviewee_id as string)
            .eq("course_id", courseSkill.course_id)
            .maybeSingle();

          if (!existingEnrollment) {
            await db.from("course_enrollments").insert({
              id: uid(),
              profile_id: review.reviewee_id as string,
              course_id: courseSkill.course_id,
              completed_lessons: [],
            });
          }
        }
      }
    }

    const { data: updated, error: fetchErr } = await db
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
