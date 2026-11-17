# Ocean Glass

A private business learning app, built for one learner. It has curriculums, degree programs, topics and concept cards, each with plain-language explanations in **English** and **Bosnian/Croatian**, plus a YouTube video for each concept.

Only two accounts exist: `msimic` (student) and `admin`, plus an optional read-only `guest` account for showing the app to others. There is no sign-up page. Every page needs a login.

## What's inside

- **Curriculums → programs → topics → concepts.** Cards show progress and whether something is not started, in progress or done.
- **Concept cards** slide in from the right. Each one has a video, a one-sentence summary, a simple explanation, a real-life example, why it matters and a common mix-up.
- **Glossary** lists every term in one place and can be searched in both languages.
- **My progress** shows how far you are in each program.
- **Settings** lets you change the language and your password.
- **Admin** (admin account only) lets you pick the YouTube video for each concept.

## Tech

- Next.js (App Router) with TypeScript
- SQLite (`better-sqlite3`) for users, progress and video links, stored in one file
- Signed, httpOnly session cookies (`jose`) and bcrypt password hashes
- Docker and Caddy, which gives the site automatic HTTPS

## Adding or editing lessons

Lessons are plain JSON files in `content/`:

```
content/
  business/
    curriculum.json          ← the curriculum and its programs
    finance/                 ← one folder per program
      01-money-basics.json   ← one file per topic (sorted by name)
      02-everyday-terms.json
      ...
```

A program without a folder shows as "Coming soon". To add one, create the folder and add topic files in the same shape as the finance ones. Each concept looks like this:

```json
{
  "slug": "equity",
  "term": "Equity",
  "local": "kapital",
  "minutes": 6,
  "youtube": "",
  "youtubeQuery": "what is equity explained simply",
  "formula": { "en": "Equity = Assets − Liabilities", "bs": "Kapital = Imovina − Obaveze" },
  "related": ["Asset", "Liability"],
  "en": { "one": "...", "explain": "...", "example": "...", "why": "...", "mixup": "..." },
  "bs": { "one": "...", "explain": "...", "example": "...", "why": "...", "mixup": "..." }
}
```

`youtube` can hold a video ID. Videos picked on the Admin page take priority over it.

## Run locally

```bash
cp .env.example .env      # fill in SESSION_SECRET and the two passwords
npm install
npm run dev               # http://localhost:3000
```

## Deploy on a Hostinger VPS

1. **Point your domain** (or a subdomain such as `learn.yourdomain.com`) to the VPS IP with an `A` record in Hostinger's DNS settings.
2. **Install Docker** on the VPS. Hostinger offers an Ubuntu + Docker template, or you can run:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. **Get the code and configure it:**
   ```bash
   git clone https://github.com/LaDeMonika/OceanGlass.git
   cd OceanGlass
   cp .env.example .env
   nano .env
   ```
   Fill in:
   - `SESSION_SECRET`: run `openssl rand -base64 48` and paste the result
   - `MSIMIC_PASSWORD` and `ADMIN_PASSWORD`: long passwords, at least 10 characters
   - `DOMAIN`: your domain, e.g. `learn.yourdomain.com`

   Put each password and the secret in single quotes, e.g. `ADMIN_PASSWORD='my$ecret'`. Without the quotes, Docker reads a `$` as the start of a variable and changes the value.
4. **Start it:**
   ```bash
   docker compose up -d --build
   ```
   Caddy gets the HTTPS certificate automatically. Open `https://your-domain` and sign in.
5. **Open only these ports** in the VPS firewall: 22 (SSH), 80 and 443.

### Update to a new version

```bash
git pull
docker compose up -d --build
```

Your progress and video links stay safe in the `app-data` Docker volume.

### Back up your progress

Your accounts, progress and video links all live in one small database file. The backup script copies it safely while the app keeps running. It saves the copy in the `backups/` folder next to the code on the server, outside Docker, and keeps the newest 14 copies.

**Make a backup now** (from the OceanGlass folder):

```bash
docker compose exec -T -u root app node scripts/backup.mjs
ls backups/
```

**Back up automatically every night at 3:00.** Run `crontab -e`, choose `nano` if it asks, and add this line at the bottom:

```
0 3 * * * cd /root/OceanGlass && docker compose exec -T -u root app node scripts/backup.mjs >> backups/backup.log 2>&1
```

Change `/root/OceanGlass` if your folder is somewhere else (`pwd` shows it). Save with Ctrl+O, Enter, then Ctrl+X. To keep more or fewer copies, add `-e BACKUP_KEEP=30` after `exec`.

**Keep a copy off the server too.** Copy the backups to your own computer once in a while. Run this on your computer, not the server:

```bash
scp -r root@YOUR_VPS_IP:/root/OceanGlass/backups ./oceanglass-backups
```

### Restore a backup

1. See which backups you have: `ls backups/`
2. Stop the app, restore the one you want, and start it again:

```bash
docker compose stop app
docker compose run --rm -u root app node scripts/restore.mjs app-2026-11-17-03-00-00.db
docker compose start app
```

Use your real file name in the middle line. The database you are replacing is kept as `app.db.before-restore`, just in case.

Stopping the app (`docker compose stop`) or rebuilding it never deletes your data or your backups. Only `docker compose down -v` deletes the database, so never add `-v`.

### Forgot a password

```bash
docker compose exec app node scripts/set-password.mjs msimic "a new long password"
```

## Guest account

To let someone look around, set `GUEST_PASSWORD='something-simple'` in `.env` and run `docker compose up -d`. They sign in as `guest` with that password.

- Guests can open every curriculum, topic, concept card, video and the glossary.
- Nothing they do is saved: no progress, no language choice, and no password changes.
- They cannot open My progress, Settings or Admin. A banner tells them they're in guest mode.

To change the guest password, edit `.env` and run `docker compose up -d` again. To turn the guest account off, empty `GUEST_PASSWORD` and do the same.

## Security notes

- Only `msimic`, `admin` and (when `GUEST_PASSWORD` is set) `guest` can ever exist. Any other account in the database is removed on start.
- All pages are checked twice: once by `proxy.ts` and again on the server against the database.
- After 5 wrong logins in 15 minutes, logins from that address are paused.
- Changing a password signs out every other device.
- The app sends `noindex` so search engines do not list it, and it cannot be framed by other sites.
- The two passwords in `.env` are only used to create the accounts on first start. After that, change them in Settings.
