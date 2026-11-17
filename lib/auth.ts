import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getUserById, type UserRow } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session-token";

/** Returns the signed-in user, checked against the database on every request. */
export const currentUser = cache(async (): Promise<UserRow | null> => {
  const jar = await cookies();
  const s = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const u = getUserById(s.uid);
  if (!u || u.session_version !== s.sv || u.role !== s.role) return null;
  return u;
});

export async function requireUser(): Promise<UserRow> {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin(): Promise<UserRow> {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  return u;
}

export async function startSession(u: UserRow) {
  const token = await signSession({ uid: u.id, role: u.role, sv: u.session_version });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/* ---- Simple in-memory login rate limit: 5 failed tries per 15 minutes ---- */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 15 * 60 * 1000;
const MAX = 5;

export function isRateLimited(key: string): boolean {
  const a = attempts.get(key);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW) {
    attempts.delete(key);
    return false;
  }
  return a.count >= MAX;
}

export function recordFailure(key: string) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > WINDOW) attempts.set(key, { count: 1, first: Date.now() });
  else a.count++;
}

export function clearFailures(key: string) {
  attempts.delete(key);
}
