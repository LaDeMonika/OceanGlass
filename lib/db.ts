import "server-only";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

export type Role = "student" | "admin";

/** The only accounts that may ever exist in this app. */
export const ALLOWED_USERS: { username: string; role: Role; envVar: string }[] = [
  { username: "msimic", role: "student", envVar: "MSIMIC_PASSWORD" },
  { username: "admin", role: "admin", envVar: "ADMIN_PASSWORD" },
];

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  role: Role;
  lang: string;
  session_version: number;
}

const globalForDb = globalThis as unknown as { __ogDb?: Database.Database };

function open(): Database.Database {
  const dir = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || "./data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "app.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student','admin')),
      lang TEXT NOT NULL DEFAULT 'en',
      session_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS progress (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concept_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('started','done')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, concept_id)
    );
    CREATE TABLE IF NOT EXISTS videos (
      concept_id TEXT PRIMARY KEY,
      youtube_id TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedUsers(db);
  return db;
}

/** Creates msimic and admin on first start, from env passwords. Never creates anyone else. */
function seedUsers(db: Database.Database) {
  const exists = db.prepare("SELECT 1 FROM users WHERE username = ?");
  const insert = db.prepare(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)"
  );
  for (const u of ALLOWED_USERS) {
    if (exists.get(u.username)) continue;
    const pw = process.env[u.envVar];
    if (!pw || pw.length < 10) {
      console.warn(
        `[oceanglass] Account "${u.username}" not created: set ${u.envVar} (10+ characters) and restart.`
      );
      continue;
    }
    insert.run(u.username, bcrypt.hashSync(pw, 12), u.role);
    console.log(`[oceanglass] Created account "${u.username}".`);
  }
  // Remove anything that is not an allowed account (defence in depth).
  const allowed = ALLOWED_USERS.map((u) => u.username);
  db.prepare(
    `DELETE FROM users WHERE username NOT IN (${allowed.map(() => "?").join(",")})`
  ).run(...allowed);
}

export function db(): Database.Database {
  if (!globalForDb.__ogDb) globalForDb.__ogDb = open();
  return globalForDb.__ogDb;
}

export function getUserByName(username: string): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE username = ?").get(username) as UserRow | undefined;
}

export function getUserById(id: number): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}
