import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import {
  getSessionUser,
  getProfileByUserId,
  hashPassword,
  verifyPassword,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    const session = await getSessionUser(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileByUserId(session.userId);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "currentPassword and newPassword are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const { data: user, error } = await db
      .from("users")
      .select("password_hash")
      .eq("id", session.userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(newPassword);
    const { error: updateErr } = await db
      .from("users")
      .update({ password_hash: newHash })
      .eq("id", session.userId);
    if (updateErr) throw new Error(`Failed to update password: ${updateErr.message}`);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
