import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const domain = url.searchParams.get("domain");
    if (!domain) {
      return NextResponse.json(
        { error: "domain query parameter is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const emailPattern = `%@${domain}`;

    // Find profiles matching the email pattern, then get distinct workspaces
    const { data: profiles, error: profilesErr } = await db
      .from("profiles")
      .select("workspace_id")
      .ilike("email", emailPattern)
      .limit(25);

    if (profilesErr) throw profilesErr;

    const workspaceIds = [...new Set((profiles || []).map((p: { workspace_id: string }) => p.workspace_id))];

    if (workspaceIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: workspaces, error: wsErr } = await db
      .from("workspaces")
      .select("*")
      .in("id", workspaceIds)
      .limit(25);

    if (wsErr) throw wsErr;
    return NextResponse.json(workspaces);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
