// Puts a backup back in place. Run it only while the app is stopped
// (see README, "Restore a backup"):
//   docker compose stop app
//   docker compose run --rm -u root app node scripts/restore.mjs app-2026-11-17-03-30-00.db
//   docker compose start app
//
// The current database is kept as app.db.before-restore, just in case.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.env.DATA_DIR || "./data");
const backupDir = path.resolve(process.env.BACKUP_DIR || "/backups");
const name = process.argv[2];

const list = () =>
  fs.existsSync(backupDir) ? fs.readdirSync(backupDir).filter((f) => /^app-[\d-]+\.db$/.test(f)).sort() : [];

if (!name) {
  console.error("Usage: node scripts/restore.mjs <backup file name>\nAvailable backups:");
  for (const f of list()) console.error(`  ${f}`);
  process.exit(1);
}

if (!/^app-[\d-]+\.db$/.test(path.basename(name))) {
  console.error(`"${name}" is not a backup file name. It should look like app-2026-11-17-03-30-00.db`);
  process.exit(1);
}
const source = path.join(backupDir, path.basename(name));
if (!fs.existsSync(source)) {
  console.error(`Backup not found: ${path.basename(name)}`);
  process.exit(1);
}

const check = new Database(source, { readonly: true });
const ok = check.pragma("integrity_check", { simple: true });
check.close();
if (ok !== "ok") {
  console.error(`That backup is damaged (${ok}). Pick another one.`);
  process.exit(1);
}

const target = path.join(dataDir, "app.db");
fs.mkdirSync(dataDir, { recursive: true });
if (fs.existsSync(target)) {
  // Fold any pending changes into the main file before saving the safety copy.
  try {
    const cur = new Database(target);
    cur.pragma("wal_checkpoint(TRUNCATE)");
    cur.close();
  } catch {}
  fs.copyFileSync(target, `${target}.before-restore`);
}
for (const extra of ["-wal", "-shm"]) fs.rmSync(target + extra, { force: true });
fs.copyFileSync(source, target);

// Give the file back to the app's user (the container runs as "app").
try {
  const { uid, gid } = fs.statSync(dataDir);
  fs.chownSync(target, uid, gid);
} catch {}

console.log(`Restored ${path.basename(source)}. Start the app again with: docker compose start app`);
