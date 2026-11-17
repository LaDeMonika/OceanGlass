// Makes a safe copy of the database while the app keeps running, then
// deletes the oldest copies so only the newest KEEP remain.
//
// On the server (see README, "Back up your progress"):
//   docker compose exec -T -u root app node scripts/backup.mjs
//
// Env: DATA_DIR (default ./data), BACKUP_DIR (default /backups), BACKUP_KEEP (default 14)
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.env.DATA_DIR || "./data");
const backupDir = path.resolve(process.env.BACKUP_DIR || "/backups");
const keep = Math.max(1, parseInt(process.env.BACKUP_KEEP || "14", 10) || 14);
const source = path.join(dataDir, "app.db");

if (!fs.existsSync(source)) {
  console.error(`No database at ${source}. Start the app once first.`);
  process.exit(1);
}
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19); // 2026-11-17-03-30-00
const target = path.join(backupDir, `app-${stamp}.db`);
const tmp = `${target}.partial`;

// SQLite's online backup copies a consistent snapshot even while the app is writing.
const db = new Database(source, { readonly: true, fileMustExist: true });
try {
  await db.backup(tmp);
} finally {
  db.close();
}

// Turn the copy into a single self-contained file, then make sure it is readable.
const check = new Database(tmp);
check.pragma("journal_mode = DELETE");
const result = check.pragma("integrity_check", { simple: true });
check.close();
for (const extra of ["-wal", "-shm"]) fs.rmSync(tmp + extra, { force: true });
if (result !== "ok") {
  fs.rmSync(tmp, { force: true });
  console.error(`Backup failed its integrity check: ${result}`);
  process.exit(1);
}
fs.renameSync(tmp, target);
console.log(`Backup saved: ${path.basename(target)} (${Math.round(fs.statSync(target).size / 1024)} KB)`);

// Keep only the newest copies.
const old = fs
  .readdirSync(backupDir)
  .filter((f) => /^app-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.db$/.test(f))
  .sort()
  .reverse()
  .slice(keep);
for (const f of old) {
  fs.rmSync(path.join(backupDir, f), { force: true });
  console.log(`Removed old backup: ${f}`);
}
