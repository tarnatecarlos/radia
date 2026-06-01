import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "creator" && profile.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getDb();

    const { data: requestRows, error: reqErr } = await db
      .from("admin_requests")
      .select(
        "*, profiles!inner(first_name, last_name, email, title, role, avatar_url, workspace_id)"
      )
      .eq("profiles.workspace_id", profile.workspace_id as string)
      .order("created_at", { ascending: false });

    if (reqErr) throw reqErr;

    const requests = (requestRows || []).map((r: Record<string, unknown>) => {
      const p = r.profiles as Record<string, unknown>;
      return {
        ...r,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        profile_title: p.title,
        role: p.role,
        avatar_url: p.avatar_url,
        profiles: undefined,
      };
    });

    const { data: adminRows, error: admErr } = await db
      .from("server_admins")
      .select(
        "*, profiles!inner(first_name, last_name, email, title, role, avatar_url, workspace_id)"
      )
      .eq("profiles.workspace_id", profile.workspace_id as string)
      .order("granted_at", { ascending: false });

    if (admErr) throw admErr;

    const admins = (adminRows || []).map((r: Record<string, unknown>) => {
      const p = r.profiles as Record<string, unknown>;
      return {
        ...r,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        profile_title: p.title,
        role: p.role,
        avatar_url: p.avatar_url,
        profiles: undefined,
      };
    });

    const { data: auditRows, error: auditErr } = await db
      .from("audit_log")
      .select("*, profiles:actor_id(first_name, last_name)")
      .eq("workspace_id", profile.workspace_id as string)
      .order("created_at", { ascending: false })
      .limit(100);

    if (auditErr) throw auditErr;

    const auditLog = (auditRows || []).map((row: Record<string, unknown>) => {
      const actor = row.profiles as { first_name: string; last_name: string } | null;
      return {
        ...row,
        actor_first_name: actor?.first_name ?? null,
        actor_last_name: actor?.last_name ?? null,
        profiles: undefined,
      };
    });

    return NextResponse.json({
      requests,
      admins,
      auditLog,
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

    if (profile.role !== "creator" && profile.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

      const { data: req, error: fetchErr } = await db
        .from("admin_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!req) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 }
        );
      }

      await db
        .from("admin_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile.id as string,
        })
        .eq("id", requestId);

      // Create server_admin entry
      await db.from("server_admins").insert({
        id: uid(),
        profile_id: req.profile_id as string,
        server_role: req.requested_role as string,
        granted_by: profile.id as string,
      });

      // Create audit log
      await db.from("audit_log").insert({
        id: uid(),
        workspace_id: profile.workspace_id as string,
        actor_id: profile.id as string,
        action: "approve_admin_request",
        metadata: { requestId, role: req.requested_role },
      });

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

      const { data: req, error: fetchErr } = await db
        .from("admin_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!req) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 }
        );
      }

      await db
        .from("admin_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile.id as string,
        })
        .eq("id", requestId);

      await db.from("audit_log").insert({
        id: uid(),
        workspace_id: profile.workspace_id as string,
        actor_id: profile.id as string,
        action: "reject_admin_request",
        metadata: { requestId, role: req.requested_role },
      });

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

      await db.from("audit_log").insert({
        id: uid(),
        workspace_id: profile.workspace_id as string,
        actor_id: profile.id as string,
        action: logAction,
        metadata: metadata || {},
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
