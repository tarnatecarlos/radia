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
    const { data: keys, error } = await db
      .from("api_keys")
      .select("id, name, key_prefix, scopes, created_at, last_used_at, revoked_at, profiles!inner(first_name, last_name)")
      .eq("workspace_id", profile.workspace_id as string)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      (keys || []).map((k: Record<string, unknown>) => {
        const p = k.profiles as { first_name: string; last_name: string };
        return {
          ...k,
          created_by_name: `${p.first_name} ${p.last_name}`,
          profiles: undefined,
        };
      })
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

    const db = getDb();
    const { error } = await db.from("api_keys").insert({
      id,
      workspace_id: profile.workspace_id as string,
      name: name.trim(),
      key_prefix: prefix,
      key_hash: hash,
      scopes: scopes || ["read"],
      created_by: profile.id as string,
    });

    if (error) throw error;

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
    const { data: existing, error: fetchErr } = await db
      .from("api_keys")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string)
      .is("revoked_at", null)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) return NextResponse.json({ error: "Key not found or already revoked" }, { status: 404 });

    // Revoke old key
    await db
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);

    // Create new key with same name + scopes
    const newId = uid();
    const rawKey = `radia_${crypto.randomBytes(32).toString("hex")}`;
    const prefix = rawKey.slice(0, 12) + "...";
    const hash = hashKey(rawKey);

    const { error: insertErr } = await db.from("api_keys").insert({
      id: newId,
      workspace_id: profile.workspace_id as string,
      name: existing.name as string,
      key_prefix: prefix,
      key_hash: hash,
      scopes: existing.scopes,
      created_by: profile.id as string,
    });

    if (insertErr) throw insertErr;

    return NextResponse.json({ id: newId, name: existing.name, key: rawKey, prefix, scopes: existing.scopes });
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
    const { error } = await db
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id as string);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
