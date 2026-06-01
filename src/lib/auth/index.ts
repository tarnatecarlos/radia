import { getDb, uid } from "@/lib/db";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "radia_session";
const SESSION_TTL_DAYS = 30;

export { SESSION_COOKIE };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const sessionId = uid();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await db.from("sessions").insert({ id: sessionId, user_id: userId, expires_at: expiresAt });
  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return sessionId;
}

/**
 * Validate a session and return the user + profile in a SINGLE query.
 * This replaces the old 3-step: getSessionUser → getProfileByUserId.
 */
export async function getAuthFromSession(sessionId: string | undefined) {
  if (!sessionId) return null;
  const db = getDb();

  const { data, error } = await db
    .from("sessions")
    .select("user_id, users!inner(id, email), profiles:users!inner(profiles(*))")
    .eq("id", sessionId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  const user = data.users as unknown as { id: string; email: string };
  const profilesArr = (data.profiles as unknown as { profiles: Record<string, unknown>[] })?.profiles;
  const profile = profilesArr?.[0] ?? null;

  return { userId: user.id, email: user.email, profile };
}

/** Simpler session check (no profile) — used by dashboard layout */
export async function getSessionUser(sessionId: string | undefined): Promise<{ userId: string; email: string } | null> {
  if (!sessionId) return null;
  const db = getDb();

  const { data, error } = await db
    .from("sessions")
    .select("user_id, users!inner(email)")
    .eq("id", sessionId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  const userObj = data.users as unknown as { email: string };
  return { userId: data.user_id, email: userObj.email };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db.from("sessions").delete().eq("id", sessionId);
}

export async function deleteAllSessions(userId: string): Promise<void> {
  const db = getDb();
  await db.from("sessions").delete().eq("user_id", userId);
}

export async function getProfileByUserId(userId: string) {
  const db = getDb();
  const { data, error } = await db.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) return undefined;
  return data ?? undefined;
}

/**
 * Server-side auth helper — reads session cookie, returns profile.
 * Single DB round-trip via join.
 */
export async function getAuthProfile() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getDb();
  const { data, error } = await db
    .from("sessions")
    .select("users!inner(profiles(*))")
    .eq("id", sessionId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  const nested = data.users as unknown as { profiles: Record<string, unknown>[] };
  return nested?.profiles?.[0] ?? null;
}

/** Fire-and-forget expired session cleanup — call from cron, not hot path */
export async function cleanExpiredSessions(): Promise<void> {
  const db = getDb();
  await db.from("sessions").delete().lte("expires_at", new Date().toISOString());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  };
}
