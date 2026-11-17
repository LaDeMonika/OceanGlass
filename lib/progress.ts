import "server-only";
import { db } from "./db";
import { conceptId, type Curriculum, type Degree, type Topic } from "./content";

export type Status = "new" | "started" | "done";

export function progressMap(userId: number): Map<string, "started" | "done"> {
  const rows = db()
    .prepare("SELECT concept_id, status FROM progress WHERE user_id = ?")
    .all(userId) as { concept_id: string; status: "started" | "done" }[];
  return new Map(rows.map((r) => [r.concept_id, r.status]));
}

export function setStatus(userId: number, id: string, status: "started" | "done" | "new") {
  if (status === "new") {
    db().prepare("DELETE FROM progress WHERE user_id = ? AND concept_id = ?").run(userId, id);
    return;
  }
  if (status === "started") {
    // never downgrade a done concept back to started
    db()
      .prepare(
        "INSERT INTO progress (user_id, concept_id, status) VALUES (?, ?, 'started') ON CONFLICT(user_id, concept_id) DO NOTHING"
      )
      .run(userId, id);
    return;
  }
  db()
    .prepare(
      "INSERT INTO progress (user_id, concept_id, status) VALUES (?, ?, 'done') ON CONFLICT(user_id, concept_id) DO UPDATE SET status='done', updated_at=datetime('now')"
    )
    .run(userId, id);
}

export function lastActivity(userId: number): string | undefined {
  const r = db()
    .prepare("SELECT concept_id FROM progress WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1")
    .get(userId) as { concept_id: string } | undefined;
  return r?.concept_id;
}

export interface Stat {
  done: number;
  total: number;
  pct: number;
  status: Status;
}

function stat(done: number, started: number, total: number): Stat {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const status: Status = total && done === total ? "done" : done + started > 0 ? "started" : "new";
  return { done, total, pct, status };
}

export function topicStat(map: Map<string, string>, cur: string, deg: string, t: Topic): Stat {
  let done = 0,
    started = 0;
  for (const k of t.concepts) {
    const s = map.get(conceptId(cur, deg, t.slug, k.slug));
    if (s === "done") done++;
    else if (s === "started") started++;
  }
  return stat(done, started, t.concepts.length);
}

export function degreeStat(map: Map<string, string>, cur: string, d: Degree): Stat & { topicsDone: number } {
  let done = 0,
    started = 0,
    total = 0,
    topicsDone = 0;
  for (const t of d.topics) {
    const s = topicStat(map, cur, d.slug, t);
    done += s.done;
    total += s.total;
    if (s.status === "done") topicsDone++;
    for (const k of t.concepts) if (map.get(conceptId(cur, d.slug, t.slug, k.slug)) === "started") started++;
  }
  return { ...stat(done, started, total), topicsDone };
}

export function curriculumStat(map: Map<string, string>, c: Curriculum): Stat {
  let done = 0,
    total = 0,
    started = 0;
  for (const d of c.degrees) {
    const s = degreeStat(map, c.slug, d);
    done += s.done;
    total += s.total;
    if (s.status === "started") started++;
  }
  return stat(done, started, total);
}
