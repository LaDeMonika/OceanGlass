import "server-only";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

export type Role = "student" | "admin" | "guest";

/** Username of the optional read-only preview account. */
export const GUEST_USERNAME = "guest";

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
      role TEXT NOT NULL CHECK (role IN ('student','admin','guest')),
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
    CREATE TABLE IF NOT EXISTS quiz_scores (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_id TEXT NOT NULL,
      best INTEGER NOT NULL,
      total INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, topic_id)
    );
    CREATE TABLE IF NOT EXISTS videos (
      concept_id TEXT PRIMARY KEY,
      youtube_id TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  migrateRoleCheck(db);
  seedUsers(db);
  return db;
}

/** Databases created before the guest account existed only allow 'student' and 'admin'. Rebuild that table once. */
function migrateRoleCheck(db: Database.Database) {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as { sql: string };
  if (row.sql.includes("'guest'")) return;
  db.pragma("foreign_keys = OFF");
  db.transaction(() => {
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student','admin','guest')),
        lang TEXT NOT NULL DEFAULT 'en',
        session_version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO users_new SELECT id, username, password_hash, role, lang, session_version, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
    `);
  })();
  db.pragma("foreign_keys = ON");
  console.log("[oceanglass] Updated users table to allow the guest account.");
}

/**
 * Creates msimic and admin on first start, from env passwords.
 * The guest account follows GUEST_PASSWORD on every start: set it to turn the
 * guest on (or change its password), remove it to turn the guest off.
 * Nobody else can ever exist.
 */
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

  const guestPw = process.env.GUEST_PASSWORD;
  const guest = db.prepare("SELECT password_hash FROM users WHERE username = ?").get(GUEST_USERNAME) as
    | { password_hash: string }
    | undefined;
  if (guestPw && guestPw.length >= 4) {
    if (!guest) {
      insert.run(GUEST_USERNAME, bcrypt.hashSync(guestPw, 10), "guest");
      console.log(`[oceanglass] Guest account is on.`);
    } else if (!bcrypt.compareSync(guestPw, guest.password_hash)) {
      db.prepare(
        "UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE username = ?"
      ).run(bcrypt.hashSync(guestPw, 10), GUEST_USERNAME);
      console.log(`[oceanglass] Guest password updated.`);
    }
  } else if (guest) {
    console.log(`[oceanglass] Guest account is off (GUEST_PASSWORD not set).`);
  }

  // Remove anything that is not an allowed account (defence in depth).
  const allowed = ALLOWED_USERS.map((u) => u.username);
  if (guestPw && guestPw.length >= 4) allowed.push(GUEST_USERNAME);
  db.prepare(
    `DELETE FROM users WHERE username NOT IN (${allowed.map(() => "?").join(",")})`
  ).run(...allowed);
  // Guests never keep data.
  db.prepare("DELETE FROM progress WHERE user_id IN (SELECT id FROM users WHERE role = 'guest')").run();
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
