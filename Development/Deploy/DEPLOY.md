# Leish — Launch Blocker Fixes — 2026-07-26

Two fixes. I verified both locally (cloned your repo read-only) but have no
push access to GitHub or your Neon DATABASE_URL, so you need to run these.

---

## Fix 1 — Revert the broken build (proxy.ts rename)

Confirmed via `Vercel:get_deployment_build_logs` on dpl_9i8X4P2qwVzMrgvM2yB4YUFG85i6:
```
Error: ENOENT: .next/server/middleware.js.nft.json
```
Same Sentry/Next-16 conflict as before. Your production is currently stuck
on commit 04fab15 (previous deploy) because 37c8a85 never built.

```bash
cd ~/Project/migrate-leishmy-to-nextjs
git fetch origin
git checkout main
git pull
git revert 37c8a85 --no-edit
git push origin main
```

**Verify after push (wait ~2 min for build):**
```bash
# Check the new deployment built clean
curl -s -o /dev/null -w "%{http_code}\n" https://app.leish.my
```
Or just check Vercel dashboard → should show a new READY production deployment
on top of the revert commit.

Don't re-attempt the proxy.ts rename until `@sentry/nextjs` ships explicit
Turbopack + proxy.ts support (currently unresolved — see sentry-javascript
issue #21713, still open as of this week). Track it before trying again.

---

## Fix 2 — payments.idempotency_key missing in production DB

Confirmed via `Vercel:get_runtime_errors` (last 24h):
```
error: column "idempotency_key" does not exist
routes=/api/admin
```
`src/db/schema.ts` line 252 declares this column but no migration ever added
it — your journal jumps `0011 → 0014` (the profiles-collapse migration),
`idempotency_key` was never in there. This is schema/DB drift: your payment
dedup logic has been silently unenforced in production.

**Step 1 — apply the column now (safe, additive, no lock risk):**
```bash
psql "$DATABASE_URL" -f manual_fix.sql
```
(included in this bundle — just `ALTER TABLE payments ADD COLUMN IF NOT
EXISTS idempotency_key varchar(255) UNIQUE`)

**Step 2 — bring your migration history back in sync**, so drizzle-kit
doesn't think this column is still pending next time you run generate:
```bash
cd ~/Project/migrate-leishmy-to-nextjs
npx drizzle-kit generate --name add_payment_idempotency_key
```
This will prompt interactively (needs your TTY — couldn't run headless
in my sandbox). When it asks about the `payments` table / `idempotency_key`
column, choose **"create column"**, not "rename from X" — it's a genuinely
new column, not a rename of something in the profiles-collapse migration.

Then mark it as already-applied (since you just ran it manually in Step 1)
rather than re-running the ALTER:
```bash
npx drizzle-kit migrate
```
If it errors with "column already exists," that's expected — it means the
manual fix in Step 1 already covers it; just confirm the new migration file
landed in `drizzle/` and commit it so future deploys stay in sync.

**Verify:**
```sql
select column_name from information_schema.columns where table_name='payments';
-- expect idempotency_key present
```

---

## After both are done

Re-check with Vercel:get_runtime_errors (7d window) — both error groups
(payments 42703, and separately watch for repeat auth cookie timeouts)
should disappear from the last-24h window once redeployed.
