// Reset a password from the server, e.g. if you get locked out:
//   docker compose exec app node scripts/set-password.mjs msimic "new long password"
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";

const [username, password] = process.argv.slice(2);
if (!["msimic", "admin"].includes(username) || !password || password.length < 10) {
  console.error('Usage: node scripts/set-password.mjs <msimic|admin> "<new password, 10+ characters>"');
  process.exit(1);
}
const db = new Database(path.join(path.resolve(process.env.DATA_DIR || "./data"), "app.db"));
const r = db
  .prepare("UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE username = ?")
  .run(bcrypt.hashSync(password, 12), username);
console.log(r.changes ? `Password for "${username}" updated. Other devices are signed out.` : `User "${username}" not found. Start the app once first.`);
