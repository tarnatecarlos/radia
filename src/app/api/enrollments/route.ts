import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const { data: rows, error } = await db
      .from("course_enrollments")
      .select("*")
      .eq("profile_id", profile.id as string);

    if (error) throw error;
    return NextResponse.json(rows);
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
    const { data: row, error } = await db
      .from("course_enrollments")
      .insert({
        id,
        profile_id: profile.id as string,
        course_id,
        completed_lessons: completed_lessons || [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(row);
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
    const { data: existing, error: fetchErr } = await db
      .from("course_enrollments")
      .select("*")
      .eq("id", id)
      .eq("profile_id", profile.id as string)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    const courseId = existing.course_id as string;

    // Count total lessons for the course
    const { count: totalLessons, error: countErr } = await db
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (countErr) throw countErr;

    const completedAt =
      completed_lessons &&
      completed_lessons.length >= (totalLessons ?? 0) &&
      (totalLessons ?? 0) > 0
        ? new Date().toISOString()
        : null;

    const justCompleted = !!(completedAt && !existing.completed_at);

    // Update the enrollment
    const updatePayload: Record<string, unknown> = {
      completed_lessons: completed_lessons || [],
      completed_at: completedAt,
    };

    const { error: updateErr } = await db
      .from("course_enrollments")
      .update(updatePayload)
      .eq("id", id);

    if (updateErr) throw updateErr;

    // Profile enrichment: on course completion, issue certification + update skills
    if (justCompleted) {
      const profileId = existing.profile_id as string;

      // Insert certification (ignore conflict)
      await db
        .from("certifications")
        .upsert(
          { id: uid(), profile_id: profileId, course_id: courseId },
          { onConflict: "profile_id,course_id" }
        );

      // Get course skills
      const { data: courseSkills } = await db
        .from("course_skills")
        .select("skill_id")
        .eq("course_id", courseId);

      for (const cs of courseSkills || []) {
        // Link skill to certification
        await db
          .from("certifications")
          .update({ skill_id: cs.skill_id })
          .eq("profile_id", profileId)
          .eq("course_id", courseId)
          .is("skill_id", null);

        // Check existing profile skill
        const { data: existingSkill } = await db
          .from("profile_skills")
          .select("id, proficiency")
          .eq("profile_id", profileId)
          .eq("skill_id", cs.skill_id)
          .maybeSingle();

        if (existingSkill) {
          const levels = ["beginner", "intermediate", "advanced", "expert"];
          if (levels.indexOf(existingSkill.proficiency) < levels.indexOf("intermediate")) {
            await db
              .from("profile_skills")
              .update({
                proficiency: "intermediate",
                source: "certification",
                verified_at: new Date().toISOString(),
              })
              .eq("id", existingSkill.id);
          }
        } else {
          await db.from("profile_skills").insert({
            id: uid(),
            profile_id: profileId,
            skill_id: cs.skill_id,
            proficiency: "intermediate",
            source: "certification",
            verified_at: new Date().toISOString(),
          });
        }

        // Resolve skill gaps: get review IDs for reviewee, then update gaps
        const { data: reviewRows } = await db
          .from("reviews")
          .select("id")
          .eq("reviewee_id", profileId);

        const reviewIds = (reviewRows || []).map((r: { id: string }) => r.id);
        if (reviewIds.length > 0) {
          await db
            .from("review_skill_gaps")
            .update({ resolved: true })
            .eq("skill_id", cs.skill_id)
            .in("review_id", reviewIds)
            .eq("resolved", false);
        }
      }
    }

    // Fetch updated enrollment
    const { data: updated, error: refetchErr } = await db
      .from("course_enrollments")
      .select("*")
      .eq("id", id)
      .single();

    if (refetchErr) throw refetchErr;
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
