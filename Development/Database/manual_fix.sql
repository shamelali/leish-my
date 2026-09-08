-- Emergency fix: payments.idempotency_key exists in src/db/schema.ts (line 252)
-- but was never migrated to the live DB. Confirmed via Vercel runtime errors:
-- error: column "idempotency_key" does not exist (route: /api/admin)
--
-- Safe to run directly: additive, nullable, unique. No data loss, no lock risk
-- on a small table.

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(255) UNIQUE;

-- Verify:
-- select column_name from information_schema.columns where table_name='payments';
-- Expect to see idempotency_key in the list.
