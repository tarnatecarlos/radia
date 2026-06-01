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

export async function getSessionUser(sessionId: string | undefined): Promise<{ userId: string; email: string } | null> {
  if (!sessionId) return null;
  const db = getDb();
  await maybeCleanExpiredSessions();

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

/** Probabilistic cleanup of expired sessions (~1% of calls) */
export async function maybeCleanExpiredSessions(): Promise<void> {
  if (Math.random() > 0.01) return;
  const db = getDb();
  await db.from("sessions").delete().lte("expires_at", new Date().toISOString());
}

export async function getProfileByUserId(userId: string) {
  const db = getDb();
  const { data, error } = await db.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) return undefined;
  return data ?? undefined;
}

export async function getAuthProfile() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await getSessionUser(sessionId);
  if (!session) return null;
  return (await getProfileByUserId(session.userId)) ?? null;
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
