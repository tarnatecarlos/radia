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
    const { data: courses } = await db
      .from("courses")
      .select("*, lessons(*)")
      .eq("workspace_id", profile.workspace_id as string)
      .order("sort_order", { referencedTable: "lessons", ascending: true });

    return NextResponse.json(courses);
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
      const prefs = await getWorkspacePreferences(profile.workspace_id as string);
      if (!prefs.members_can_create_courses) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    const { title, description, is_mandatory, lessons } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const courseId = uid();
    await db.from("courses").insert({
      id: courseId,
      workspace_id: profile.workspace_id as string,
      title,
      description: description || null,
      is_mandatory: !!is_mandatory,
    });

    // Insert lessons if provided
    if (Array.isArray(lessons) && lessons.length > 0) {
      const lessonRows = lessons.map((lesson, i) => ({
        id: uid(),
        course_id: courseId,
        title: lesson.title || `Lesson ${i + 1}`,
        content: lesson.content || "",
        sort_order: lesson.sort_order ?? i + 1,
        estimated_minutes: lesson.estimated_minutes ?? 5,
      }));
      await db.from("lessons").insert(lessonRows);
    }

    // Return course with lessons
    const { data: course } = await db
      .from("courses")
      .select("*, lessons(*)")
      .eq("id", courseId)
      .order("sort_order", { referencedTable: "lessons", ascending: true })
      .single();

    return NextResponse.json(course);
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
    const { data: existing } = await db
      .from("courses")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await db.from("courses").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
