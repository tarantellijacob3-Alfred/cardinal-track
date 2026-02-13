# Migration Guide — Running v2 Migrations on Live Supabase

**IMPORTANT:** These migrations modify the LIVE database. Take a backup first.

---

## Prerequisites

1. You have access to the Supabase project dashboard
2. You know the project URL and have admin access
3. You have a recent backup (or can create one)

---

## Step 1: Create a Backup

### Option A: Supabase Dashboard
1. Go to **Project Settings** → **Database** → **Backups**
2. Click **Create backup** (if available on your plan)
3. Wait for backup to complete

### Option B: Manual pg_dump
```bash
# Get your database connection string from Supabase dashboard
# Settings → Database → Connection string → URI
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup_pre_v2_$(date +%Y%m%d).sql
```

---

## Step 2: Run Migrations (in order)

Go to **Supabase Dashboard** → **SQL Editor** → **New query**

Run each migration one at a time, in order. Verify each succeeds before proceeding.

### Migration 1: Create teams table
```sql
-- Copy contents of: supabase/migrations/00006_add_teams.sql
```
**Verify:** Run `SELECT * FROM teams;` — should return empty table.

### Migration 2: Add team_id columns
```sql
-- Copy contents of: supabase/migrations/00007_add_team_id.sql
```
**Verify:** Run `SELECT column_name FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'team_id';` — should return one row.

### Migration 3: Seed Bishop Snyder & backfill
```sql
-- Copy contents of: supabase/migrations/00008_seed_bishop_snyder.sql
```
**Verify:**
```sql
-- Check team was created
SELECT * FROM teams;
-- Should show 1 row: Bishop Snyder with is_grandfathered = true

-- Check backfill worked
SELECT COUNT(*) FROM athletes WHERE team_id IS NOT NULL;
-- Should equal total athlete count

SELECT COUNT(*) FROM meets WHERE team_id IS NOT NULL;
-- Should equal total meets count

SELECT COUNT(*) FROM profiles WHERE team_id IS NOT NULL;
-- Should equal total profiles count (all should be backfilled)
```

### Migration 4: Update RLS policies
```sql
-- Copy contents of: supabase/migrations/00009_update_rls.sql
```
**Verify:**
```sql
-- Check policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'athletes';
-- Should show: Public read athletes, Coaches can insert/update/delete athletes

-- Quick test: public read should still work
-- (This doesn't require auth)
SELECT COUNT(*) FROM athletes;
```

---

## Step 3: Verify Everything Works

### Test 1: Public read still works
```sql
-- As anonymous/public user
SELECT * FROM athletes LIMIT 5;
SELECT * FROM meets LIMIT 5;
SELECT * FROM events LIMIT 5;
```

### Test 2: Team data is correct
```sql
SELECT t.name, t.slug,
  (SELECT COUNT(*) FROM athletes WHERE team_id = t.id) as athlete_count,
  (SELECT COUNT(*) FROM meets WHERE team_id = t.id) as meet_count,
  (SELECT COUNT(*) FROM profiles WHERE team_id = t.id) as profile_count
FROM teams t;
```

### Test 3: Coach can still write
Log in as a Bishop Snyder coach in the app and try:
- Add an athlete
- Create a meet
- Assign an athlete to an event

---

## Rollback Instructions

If something goes wrong, run these in REVERSE order:

### Rollback Migration 4 (RLS policies)
```sql
-- Drop new team-scoped policies
DROP POLICY IF EXISTS "Coaches can insert athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can update athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can delete athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can insert meets" ON meets;
DROP POLICY IF EXISTS "Coaches can update meets" ON meets;
DROP POLICY IF EXISTS "Coaches can delete meets" ON meets;
DROP POLICY IF EXISTS "Coaches can insert meet_entries" ON meet_entries;
DROP POLICY IF EXISTS "Coaches can update meet_entries" ON meet_entries;
DROP POLICY IF EXISTS "Coaches can delete meet_entries" ON meet_entries;

-- Re-create original policies (from 00002_rls_policies.sql)
CREATE POLICY "Coaches can insert athletes" ON athletes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));
CREATE POLICY "Coaches can update athletes" ON athletes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));
CREATE POLICY "Coaches can delete athletes" ON athletes FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));

CREATE POLICY "Coaches can insert meets" ON meets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));
CREATE POLICY "Coaches can update meets" ON meets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));
CREATE POLICY "Coaches can delete meets" ON meets FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));

CREATE POLICY "Coaches can insert meet_entries" ON meet_entries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));
CREATE POLICY "Coaches can update meet_entries" ON meet_entries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));
CREATE POLICY "Coaches can delete meet_entries" ON meet_entries FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true));
```

### Rollback Migration 3 (seed & backfill)
```sql
-- Remove NOT NULL constraints first
ALTER TABLE athletes ALTER COLUMN team_id DROP NOT NULL;
ALTER TABLE meets ALTER COLUMN team_id DROP NOT NULL;

-- Clear team_id values
UPDATE athletes SET team_id = NULL;
UPDATE meets SET team_id = NULL;
UPDATE profiles SET team_id = NULL;

-- Delete Bishop Snyder team
DELETE FROM teams WHERE slug = 'bishop-snyder';
```

### Rollback Migration 2 (team_id columns)
```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_athletes_team_id;
DROP INDEX IF EXISTS idx_meets_team_id;
DROP INDEX IF EXISTS idx_profiles_team_id;

-- Drop columns
ALTER TABLE athletes DROP COLUMN team_id;
ALTER TABLE meets DROP COLUMN team_id;
ALTER TABLE profiles DROP COLUMN team_id;
```

### Rollback Migration 1 (teams table)
```sql
-- Drop all policies first
DROP POLICY IF EXISTS "Public read teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can insert teams" ON teams;
DROP POLICY IF EXISTS "Coaches can update own team" ON teams;

-- Drop indexes and table
DROP INDEX IF EXISTS idx_teams_slug;
DROP INDEX IF EXISTS idx_teams_active;
DROP TABLE IF EXISTS teams CASCADE;
```

---

## Post-Migration: Deploy Frontend

After migrations are verified:

1. **DO NOT** deploy to Vercel yet — test locally first
2. Run `npm run dev` and verify:
   - Landing page at `http://localhost:5173/`
   - Bishop Snyder dashboard at `http://localhost:5173/t/bishop-snyder`
   - Old URLs redirect (e.g., `/roster` → `/t/bishop-snyder/roster`)
   - All existing data appears correctly
   - Coach can still add/edit/delete
   - Public search still works without auth
3. When ready to deploy, the Vercel SPA rewrite (`/(.*) → /index.html`) handles all routing

---

## Bishop Snyder UUID Reference

The Bishop Snyder team uses a fixed UUID for reliable references:
```
Team ID: a0000000-0000-0000-0000-000000000001
Slug:    bishop-snyder
```

This is used in the seed migration and can be referenced in future migrations.
