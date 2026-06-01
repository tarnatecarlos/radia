import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getAuthProfile } from "@/lib/auth";
import crypto from "crypto";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function isAdmin(profile: Record<string, unknown>): boolean {
  return profile.role === "creator" || profile.role === "moderator";
}

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(profile)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = getDb();
    const keys = db
      .prepare(
        `SELECT ak.id, ak.name, ak.key_prefix, ak.scopes, ak.created_at, ak.last_used_at, ak.revoked_at,
                p.first_name, p.last_name
         FROM api_keys ak
         JOIN profiles p ON p.id = ak.created_by
         WHERE ak.workspace_id = ?
         ORDER BY ak.created_at DESC`
      )
      .all(profile.workspace_id as string) as Record<string, unknown>[];

    return NextResponse.json(
      keys.map((k) => ({
        ...k,
        scopes: JSON.parse((k.scopes as string) || '["read"]'),
        created_by_name: `${k.first_name} ${k.last_name}`,
      }))
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(profile)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, scopes } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const id = uid();
    const rawKey = `radia_${crypto.randomBytes(32).toString("hex")}`;
    const prefix = rawKey.slice(0, 12) + "...";
    const hash = hashKey(rawKey);
    const scopesJson = JSON.stringify(scopes || ["read"]);

    const db = getDb();
    db.prepare(
      `INSERT INTO api_keys (id, workspace_id, name, key_prefix, key_hash, scopes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, profile.workspace_id as string, name.trim(), prefix, hash, scopesJson, profile.id as string);

    return NextResponse.json({ id, name: name.trim(), key: rawKey, prefix, scopes: scopes || ["read"] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(profile)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM api_keys WHERE id = ? AND workspace_id = ? AND revoked_at IS NULL")
      .get(id, profile.workspace_id as string) as Record<string, unknown> | undefined;

    if (!existing) return NextResponse.json({ error: "Key not found or already revoked" }, { status: 404 });

    // Revoke old key
    db.prepare("UPDATE api_keys SET revoked_at = datetime('now') WHERE id = ?").run(id);

    // Create new key with same name + scopes
    const newId = uid();
    const rawKey = `radia_${crypto.randomBytes(32).toString("hex")}`;
    const prefix = rawKey.slice(0, 12) + "...";
    const hash = hashKey(rawKey);

    db.prepare(
      `INSERT INTO api_keys (id, workspace_id, name, key_prefix, key_hash, scopes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(newId, profile.workspace_id as string, existing.name as string, prefix, hash, existing.scopes as string, profile.id as string);

    const scopes = JSON.parse((existing.scopes as string) || '["read"]');
    return NextResponse.json({ id: newId, name: existing.name, key: rawKey, prefix, scopes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(profile)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const db = getDb();
    db.prepare(
      "UPDATE api_keys SET revoked_at = datetime('now') WHERE id = ? AND workspace_id = ?"
    ).run(id, profile.workspace_id as string);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
