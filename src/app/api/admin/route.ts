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

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    const requests = db
      .prepare(
        `SELECT ar.*, p.first_name, p.last_name, p.email, p.title as profile_title, p.role, p.avatar_url
         FROM admin_requests ar
         JOIN profiles p ON p.id = ar.profile_id
         WHERE p.workspace_id = ?
         ORDER BY ar.created_at DESC`
      )
      .all(profile.workspace_id as string);

    const admins = db
      .prepare(
        `SELECT sa.*, p.first_name, p.last_name, p.email, p.title as profile_title, p.role, p.avatar_url
         FROM server_admins sa
         JOIN profiles p ON p.id = sa.profile_id
         WHERE p.workspace_id = ?
         ORDER BY sa.granted_at DESC`
      )
      .all(profile.workspace_id as string);

    const auditLog = db
      .prepare(
        `SELECT al.*, p.first_name as actor_first_name, p.last_name as actor_last_name
         FROM audit_log al
         LEFT JOIN profiles p ON p.id = al.actor_id
         WHERE al.workspace_id = ?
         ORDER BY al.created_at DESC
         LIMIT 100`
      )
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    const parsedAuditLog = auditLog.map((row) => ({
      ...row,
      metadata: JSON.parse((row.metadata as string) || "{}"),
    }));

    return NextResponse.json({
      requests,
      admins,
      auditLog: parsedAuditLog,
    });
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

    const body = await request.json();
    const { action } = body;

    const db = getDb();

    if (action === "approve_request") {
      const { requestId } = body;
      if (!requestId) {
        return NextResponse.json(
          { error: "requestId is required" },
          { status: 400 }
        );
      }

      const req = db
        .prepare("SELECT * FROM admin_requests WHERE id = ?")
        .get(requestId) as Record<string, unknown> | undefined;

      if (!req) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 }
        );
      }

      db.prepare(
        `UPDATE admin_requests SET status = 'approved', reviewed_at = datetime('now'), reviewed_by = ? WHERE id = ?`
      ).run(profile.id as string, requestId);

      // Create server_admin entry
      db.prepare(
        `INSERT INTO server_admins (id, profile_id, server_role, granted_by) VALUES (?, ?, ?, ?)`
      ).run(
        uid(),
        req.profile_id as string,
        req.requested_role as string,
        profile.id as string
      );

      // Create audit log
      db.prepare(
        `INSERT INTO audit_log (id, workspace_id, actor_id, action, metadata) VALUES (?, ?, ?, ?, ?)`
      ).run(
        uid(),
        profile.workspace_id as string,
        profile.id as string,
        "approve_admin_request",
        JSON.stringify({ requestId, role: req.requested_role })
      );

      return NextResponse.json({ ok: true });
    }

    if (action === "reject_request") {
      const { requestId } = body;
      if (!requestId) {
        return NextResponse.json(
          { error: "requestId is required" },
          { status: 400 }
        );
      }

      const req = db
        .prepare("SELECT * FROM admin_requests WHERE id = ?")
        .get(requestId) as Record<string, unknown> | undefined;

      if (!req) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 }
        );
      }

      db.prepare(
        `UPDATE admin_requests SET status = 'rejected', reviewed_at = datetime('now'), reviewed_by = ? WHERE id = ?`
      ).run(profile.id as string, requestId);

      db.prepare(
        `INSERT INTO audit_log (id, workspace_id, actor_id, action, metadata) VALUES (?, ?, ?, ?, ?)`
      ).run(
        uid(),
        profile.workspace_id as string,
        profile.id as string,
        "reject_admin_request",
        JSON.stringify({ requestId, role: req.requested_role })
      );

      return NextResponse.json({ ok: true });
    }

    if (action === "audit_log") {
      const { action: logAction, metadata } = body;
      if (!logAction) {
        return NextResponse.json(
          { error: "action field is required in body" },
          { status: 400 }
        );
      }

      db.prepare(
        `INSERT INTO audit_log (id, workspace_id, actor_id, action, metadata) VALUES (?, ?, ?, ?, ?)`
      ).run(
        uid(),
        profile.workspace_id as string,
        profile.id as string,
        logAction,
        JSON.stringify(metadata || {})
      );

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
