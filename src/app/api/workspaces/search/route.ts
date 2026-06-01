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
    const workspaces = db
      .prepare(
        `SELECT DISTINCT w.* FROM workspaces w
         JOIN profiles p ON p.workspace_id = w.id
         WHERE p.email LIKE ?
         LIMIT 25`
      )
      .all(emailPattern);

    return NextResponse.json(workspaces);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
