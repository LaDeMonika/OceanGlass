"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, getUserByName } from "@/lib/db";
import {
  clearFailures,
  currentUser,
  endSession,
  isRateLimited,
  recordFailure,
  requireAdmin,
  requireUser,
  startSession,
} from "@/lib/auth";
import { allConcepts, findTopicById } from "@/lib/content";
import { saveQuizScore, setStatus } from "@/lib/progress";
import { dict, getLang } from "@/lib/i18n";

// Used to keep timing similar when the username does not exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const t = dict(await getLang());
  const username = String(form.get("username") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}|${username}`;

  if (isRateLimited(key) || isRateLimited(ip)) return { error: t.tooMany };

  const user = getUserByName(username);
  const ok = bcrypt.compareSync(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    recordFailure(key);
    recordFailure(ip);
    return { error: t.badLogin };
  }
  clearFailures(key);
  await startSession(user);
  (await cookies()).set("lang", user.lang === "bs" ? "bs" : "en", { path: "/", maxAge: 31536000, sameSite: "lax" });
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function setLang(form: FormData) {
  const lang = form.get("lang") === "bs" ? "bs" : "en";
  (await cookies()).set("lang", lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  const u = await currentUser();
  if (u && u.role !== "guest") db().prepare("UPDATE users SET lang = ? WHERE id = ?").run(lang, u.id);
  revalidatePath("/", "layout");
}

const validIds = () => new Set(allConcepts().map((c) => c.id));

export async function markConcept(id: string, status: "started" | "done" | "new") {
  const u = await requireUser();
  if (u.role === "guest") return; // guests never save progress
  if (!validIds().has(id)) return;
  if (!["started", "done", "new"].includes(status)) return;
  setStatus(u.id, id, status);
  revalidatePath("/", "layout");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const t = dict(await getLang());
  const u = await requireUser();
  if (u.role === "guest") return { error: t.guestNoChanges };
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  if (!bcrypt.compareSync(current, u.password_hash)) return { error: t.passwordWrong };
  if (next.length < 10) return { error: t.passwordShort };
  db()
    .prepare("UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?")
    .run(bcrypt.hashSync(next, 12), u.id);
  // Old sessions are now invalid; issue a fresh one for this device.
  const fresh = getUserByName(u.username)!;
  await startSession(fresh);
  return { ok: t.passwordChanged };
}

function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return url.pathname.slice(1, 12) || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v) return v;
      const m = url.pathname.match(/\/(embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}

export async function saveVideo(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const t = dict(await getLang());
  const id = String(form.get("conceptId") || "");
  if (!validIds().has(id)) return { error: "Unknown concept." };
  const raw = String(form.get("url") || "").trim();
  if (!raw) {
    db().prepare("DELETE FROM videos WHERE concept_id = ?").run(id);
    revalidatePath("/", "layout");
    return { ok: t.videoSaved };
  }
  const yt = parseYouTubeId(raw);
  if (!yt || !/^[A-Za-z0-9_-]{11}$/.test(yt)) return { error: t.videoBad };
  db()
    .prepare(
      "INSERT INTO videos (concept_id, youtube_id) VALUES (?, ?) ON CONFLICT(concept_id) DO UPDATE SET youtube_id = excluded.youtube_id, updated_at = datetime('now')"
    )
    .run(id, yt);
  revalidatePath("/", "layout");
  return { ok: t.videoSaved };
}

export type QuizResult = { score: number; total: number; best?: number; saved: boolean };

/** Scores a quiz on the server from the chosen option indexes. Guests get a score but nothing is saved. */
export async function submitQuiz(topicId: string, answers: number[]): Promise<QuizResult | null> {
  const u = await requireUser();
  const topic = findTopicById(String(topicId));
  if (!topic?.quiz || !Array.isArray(answers)) return null;
  const total = topic.quiz.length;
  const score = topic.quiz.reduce((n, q, i) => n + (Number(answers[i]) === q.answer ? 1 : 0), 0);
  if (u.role === "guest") return { score, total, saved: false };
  const s = saveQuizScore(u.id, topicId, score, total);
  revalidatePath("/", "layout");
  return { score, total, best: s.best, saved: true };
}
