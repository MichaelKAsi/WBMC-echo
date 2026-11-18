## Why the mismatch happens

The Admin → User Management "Mentor / Mentee" groups are **not** built from `mentorship_applications`. They are derived from two other sources on the `profiles` / `user_roles` tables:

1. Rows in `user_roles` with role `mentor` or `mentee`.
2. Rows in `profiles` where `wants_mentorship = true` and `mentorship_role = 'mentor' | 'mentee'` (added as a fallback group in `UserManagementTab.tsx` around line 386–398).

Meanwhile the `mentorship_applications` table is populated by a different flow (Settings / Eagles modal / AuthModal signup) and today:

- All 12 application rows have `matched_user_id = NULL` — the auto-match trigger only exists for `membership_applications`, not for mentorship, so applications are never linked to a user account.
- Only 6 users have a `mentee` row in `user_roles`; 0 have a `mentor` row — even though 2 users (Bently Tladi, Michael Phiri) submitted mentor applications and 1 submitted "both" (Wesley Sibiya). That's why they show on the app-side lists but not as mentors in admin.
- 1 application in the table has no matching profile at all (`stephensskosana@gmail.com`) — likely submitted before signing up.
- There is no admin screen that actually lists `mentorship_applications`, so the source of truth is invisible to admins.

Net effect: admin sees mentors/mentees inferred from role/profile flags, while the applications table is a parallel, unlinked list — the two can (and do) disagree.

## Goal

Make the mentorship applications table the single source of truth and surface it to admins.

## Plan

1. **Link existing applications to users** (data fix, one migration)
   - Backfill `mentorship_applications.matched_user_id` and `user_id` by matching `lower(email)` to `profiles.email`.
   - For each linked application whose `role` is `mentor` / `mentee` / `both`, insert the corresponding row(s) into `user_roles` (`ON CONFLICT DO NOTHING`). `both` → insert both mentor and mentee.

2. **Auto-link on future signups and applications** (migration)
   - Add a trigger on `profiles` insert (mirroring `auto_match_membership_application`) that sets `matched_user_id` / `user_id` on any pending `mentorship_applications` row with the same email, and inserts the matching `user_roles` rows.
   - Add a trigger on `mentorship_applications` insert that does the reverse: if a `profiles` row already exists for that email, link it and grant the mentor/mentee role immediately.

3. **Admin "Mentorship Applications" tab** (new component)
   - Add a new tab in `src/pages/Admin.tsx` that lists all rows from `mentorship_applications` with columns: name, email, phone, role (mentor/mentee/both), status, linked user (yes/no), submitted date, and a "View details" button showing the full `details` JSON.
   - Provide status controls: Approve / Reject (updates `status`), which in turn keeps the `user_roles` row (`mentor`/`mentee`) in place or removes it.
   - Add an "Unlinked applications" filter so admins can see submissions with no matching account (e.g. Stephens Skosana).

4. **Fix the User Management fallback** (small edit in `UserManagementTab.tsx`)
   - Replace the `profiles.wants_mentorship + mentorship_role` fallback with a join against `mentorship_applications` (via linked `user_id`) so the "Mentor / Mentee" groups reflect actual applications, not the legacy profile flags.

## Technical notes

- Migration order per project rules: create/alter tables → GRANT → RLS → policies → triggers/functions.
- New triggers use `SECURITY DEFINER` and `SET search_path = public`, same pattern as `auto_match_membership_application`.
- No schema-breaking changes; only backfill + triggers + new admin UI.

## Out of scope

- No change to the public `/mentorship` page behaviour.
- No change to the Settings / signup flows themselves — the new triggers make them consistent without touching client code.
