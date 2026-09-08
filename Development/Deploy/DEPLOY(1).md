# Pricing Sync Fix — Deploy Steps

## What this fixes
1. **Booking price bug (revenue-critical)**: bookings were always charged at
   the artist's cheapest service price, ignoring which service the client
   actually selected. Now resolved strictly from the selected `serviceId`.
2. **Dead price field**: the "Hourly Rate" field on the artist profile form
   looked editable but silently did nothing server-side. Removed.
3. **Studio price clobbering**: the studio edit page's manual price field
   was the one write path that *did* work, silently overwriting the
   services-derived price any time a studio touched their profile form.
   Removed.
4. **Studio services never synced `profiles.price` at all** — only artist
   services did. Now both do, via the same `syncProviderPrice()` function.

`profiles.price` is now written by exactly one code path:
`syncProviderPrice()` in `/api/services`, called on service create/update/
delete and during artist onboarding. Nothing else touches it.

## Pre-deploy check
Run this against production to see which existing artists/studios have a
`profiles.price` that's already out of sync with their actual services
(this can happen from the old dead/clobbering writes before this fix):

```sql
SELECT p.user_id, p.role, p.price AS profile_price,
       COALESCE(MIN(s.price), 0) AS actual_min_service_price
FROM profiles p
LEFT JOIN services s
  ON s.artist_id = p.user_id OR s.studio_id = p.user_id
WHERE p.role IN ('artist', 'studio')
GROUP BY p.user_id, p.role, p.price
HAVING p.price IS DISTINCT FROM COALESCE(MIN(s.price), 0)::numeric;
```

If that returns rows, run the one-time backfill below after deploying the
code (so no new drift can be introduced while you fix historical data):

```sql
UPDATE profiles p
SET price = sub.min_price, updated_at = NOW()
FROM (
  SELECT COALESCE(s.artist_id, s.studio_id) AS provider_id,
         MIN(s.price) AS min_price
  FROM services s
  GROUP BY COALESCE(s.artist_id, s.studio_id)
) sub
WHERE p.user_id = sub.provider_id
  AND p.price IS DISTINCT FROM sub.min_price;
```

## Deploy

```bash
cd ~/Project/migrate-leishmy-to-nextjs
git checkout main
git pull origin main
git am 0001-fix-pricing-sync.patch
git push origin main
```

If `git am` conflicts (unlikely — this only touches 6 files):
```bash
git am --show-current-patch=diff   # inspect the conflicting hunk
# resolve manually, then:
git add -A
git am --continue
```

Vercel will auto-deploy on push. After it's live:

```bash
# sanity check — confirm the endpoint now rejects bookings without a serviceId
curl -s -X POST https://leish.my/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"artistId":"<any-real-artist-id>","clientEmail":"test@example.com","date":"2026-08-15"}'
# expect: {"error":"serviceId is required — price must be resolved from a specific service"}
```

## Files changed
- `src/app/api/bookings/route.ts` — strict service-based price resolution
- `src/app/api/services/route.ts` — `syncProviderPrice()` covers studios too
- `src/app/api/user/[action]/route.ts` — removed studio price write
- `src/components/BookingForm.tsx` — sends `serviceId`
- `src/components/ArtistProfileEditForm.tsx` — removed dead price field
- `src/app/dashboard/studio/edit/page.tsx` — removed price field

## Not included (optional follow-up)
- The artist Services dashboard page still only supports add/delete, no
  edit-in-place for an existing service's price. Works correctly with the
  sync (delete + recreate re-triggers `syncProviderPrice()`), just clunky
  UX. Worth a PUT-based edit form later.
