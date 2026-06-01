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
      const { data } = await db
        .from("profiles")
        .select(selected.join(", "))
        .eq("workspace_id", profile.workspace_id as string);

      return NextResponse.json(data);
    } else {
      const { data } = await db
        .from("profiles")
        .select("*")
        .eq("workspace_id", profile.workspace_id as string);

      return NextResponse.json(data);
    }
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
    await db.from("profiles").insert({
      id: newId,
      workspace_id: profile.workspace_id as string,
      email,
      first_name,
      last_name,
      role: role || "user",
      title: title || null,
      manager_id: manager_id || null,
    });

    await db.from("notification_preferences").insert({
      id: uid(),
      profile_id: newId,
    });

    // Auto-enroll in all mandatory courses
    const { data: mandatoryCourses } = await db
      .from("courses")
      .select("id")
      .eq("workspace_id", profile.workspace_id as string)
      .eq("is_mandatory", true);

    if (mandatoryCourses && mandatoryCourses.length > 0) {
      const enrollments = mandatoryCourses.map((course) => ({
        id: uid(),
        profile_id: newId,
        course_id: course.id,
        completed_lessons: [],
      }));
      await db.from("course_enrollments").upsert(enrollments, { onConflict: "profile_id,course_id" });
    }

    const { data: created } = await db
      .from("profiles")
      .select("*")
      .eq("id", newId)
      .single();

    return NextResponse.json({
      ...created,
      auto_enrolled_courses: mandatoryCourses?.length ?? 0,
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
    const { data: target } = await db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

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
    const updateFields: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in fields) {
        updateFields[key] = fields[key];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updated } = await db
      .from("profiles")
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
