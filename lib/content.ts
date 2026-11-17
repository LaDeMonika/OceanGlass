import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Lang } from "./i18n";

export type L = { en: string; bs: string };

export interface ConceptText {
  one: string;
  explain: string;
  example: string;
  why: string;
  mixup?: string;
}

export interface Concept {
  slug: string;
  term: string;
  local: string;
  minutes?: number;
  youtube?: string;
  youtubeQuery: string;
  formula?: L;
  related: string[];
  en: ConceptText;
  bs: ConceptText;
}

export interface Topic {
  slug: string;
  title: L;
  summary: L;
  concepts: Concept[];
}

export interface Degree {
  slug: string;
  icon: string;
  title: L;
  description: L;
  topics: Topic[];
}

export interface Curriculum {
  slug: string;
  icon: string;
  title: L;
  description: L;
  degrees: Degree[];
}

const ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "content");
const SLUG = /^[a-z0-9-]+$/;

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function load(): Curriculum[] {
  const out: Curriculum[] = [];
  for (const dir of fs.readdirSync(ROOT).sort()) {
    const curFile = path.join(ROOT, dir, "curriculum.json");
    if (!fs.existsSync(curFile)) continue;
    const meta = readJson<Omit<Curriculum, "degrees"> & { degrees: Omit<Degree, "topics">[] }>(curFile);
    const degrees: Degree[] = meta.degrees.map((d) => {
      const dDir = path.join(ROOT, dir, d.slug);
      const topics: Topic[] = fs.existsSync(dDir)
        ? fs
            .readdirSync(dDir)
            .filter((f) => f.endsWith(".json"))
            .sort()
            .map((f) => readJson<Topic>(path.join(dDir, f)))
        : [];
      return { ...d, topics };
    });
    out.push({ ...meta, degrees });
  }
  return out;
}

let cache: Curriculum[] | null = null;
/** In development the content is re-read on every request so edits show up right away. */
export function curriculums(): Curriculum[] {
  if (process.env.NODE_ENV !== "production" || !cache) cache = load();
  return cache;
}

export function findCurriculum(slug: string) {
  if (!SLUG.test(slug)) return undefined;
  return curriculums().find((c) => c.slug === slug);
}

export function findDegree(cur: string, deg: string) {
  const c = findCurriculum(cur);
  const d = c?.degrees.find((x) => x.slug === deg);
  return c && d ? { curriculum: c, degree: d } : undefined;
}

export function conceptId(cur: string, deg: string, topic: string, concept: string) {
  return `${cur}/${deg}/${topic}/${concept}`;
}

export interface FlatConcept {
  id: string;
  concept: Concept;
  topic: Topic;
  degree: Degree;
  curriculum: Curriculum;
}

export function allConcepts(): FlatConcept[] {
  const out: FlatConcept[] = [];
  for (const c of curriculums())
    for (const d of c.degrees)
      for (const t of d.topics)
        for (const k of t.concepts)
          out.push({ id: conceptId(c.slug, d.slug, t.slug, k.slug), concept: k, topic: t, degree: d, curriculum: c });
  return out;
}

export function tr(l: L, lang: Lang) {
  return l[lang] || l.en;
}
