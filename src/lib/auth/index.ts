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

export function createSession(userId: string): string {
  const db = getDb();
  const sessionId = uid();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(sessionId, userId, expiresAt);
  return sessionId;
}

export function getSessionUser(sessionId: string | undefined): { userId: string; email: string } | null {
  if (!sessionId) return null;
  const db = getDb();
  const row = db.prepare(`
    SELECT s.user_id, u.email FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(sessionId) as { user_id: string; email: string } | undefined;
  if (!row) return null;
  return { userId: row.user_id, email: row.email };
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function deleteAllSessions(userId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function getProfileByUserId(userId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined;
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
