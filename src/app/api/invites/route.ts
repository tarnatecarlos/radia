import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    // Public token validation endpoint (no auth needed)
    if (token) {
      const db = getDb();
      const { data: invite, error } = await db
        .from("invites")
        .select("*, workspaces!inner(name)")
        .eq("token", token)
        .maybeSingle();

      if (error) throw error;
      if (!invite) {
        return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
      }

      const workspace = invite.workspaces as { name: string };
      const expired = !!(invite.accepted_at) || new Date(invite.expires_at as string) <= new Date();
      return NextResponse.json({
        workspace_name: workspace.name,
        email: invite.email || null,
        role: invite.role,
        expired,
      });
    }

    // Authenticated list of workspace invites
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const { data: invites, error } = await db
      .from("invites")
      .select("*")
      .eq("workspace_id", profile.workspace_id as string)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(invites);
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
    const { email, role } = body;

    const db = getDb();
    const id = uid();
    const token = uid();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await db.from("invites").insert({
      id,
      workspace_id: profile.workspace_id as string,
      email: email || null,
      token,
      role: role || "user",
      invited_by: profile.id as string,
      expires_at: expiresAt,
    });

    if (error) throw error;

    return NextResponse.json({
      token,
      inviteUrl: `/invite/${token}`,
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

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const { data: invite, error: fetchErr } = await db
      .from("invites")
      .select("*")
      .eq("token", token)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    // Move the current user's profile to the invite's workspace
    const { error: profileErr } = await db
      .from("profiles")
      .update({
        workspace_id: invite.workspace_id as string,
        role: invite.role as string,
      })
      .eq("id", profile.id as string);

    if (profileErr) throw profileErr;

    // Mark invite as accepted
    const { error: inviteErr } = await db
      .from("invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id as string);

    if (inviteErr) throw inviteErr;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
