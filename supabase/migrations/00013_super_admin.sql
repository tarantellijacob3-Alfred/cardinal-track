-- Migration 00013: Super Admin
-- Adds is_super_admin column, sets founding super admin, updates RLS for cross-team access

-- ═══════════════════════════════════════════════════════
-- 1. Add is_super_admin column to profiles
-- ═══════════════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- Set Jacob as founding super admin
UPDATE profiles SET is_super_admin = true WHERE email = 'tarantellijacob@gmail.com';

-- ═══════════════════════════════════════════════════════
-- 2. Super Admin RLS — ATHLETES
-- ═══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Coaches can insert athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can update athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can delete athletes" ON athletes;

CREATE POLICY "Coaches can insert athletes" ON athletes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = athletes.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can update athletes" ON athletes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = athletes.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can delete athletes" ON athletes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = athletes.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ═══════════════════════════════════════════════════════
-- 3. Super Admin RLS — MEETS
-- ═══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Coaches can insert meets" ON meets;
DROP POLICY IF EXISTS "Coaches can update meets" ON meets;
DROP POLICY IF EXISTS "Coaches can delete meets" ON meets;

CREATE POLICY "Coaches can insert meets" ON meets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = meets.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can update meets" ON meets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = meets.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can delete meets" ON meets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = meets.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ═══════════════════════════════════════════════════════
-- 4. Super Admin RLS — MEET_ENTRIES
-- ═══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Coaches can insert meet_entries" ON meet_entries;
DROP POLICY IF EXISTS "Coaches can update meet_entries" ON meet_entries;
DROP POLICY IF EXISTS "Coaches can delete meet_entries" ON meet_entries;

CREATE POLICY "Coaches can insert meet_entries" ON meet_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN meets ON meets.id = meet_entries.meet_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = meets.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can update meet_entries" ON meet_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN meets ON meets.id = meet_entries.meet_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = meets.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can delete meet_entries" ON meet_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN meets ON meets.id = meet_entries.meet_id
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = meets.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ═══════════════════════════════════════════════════════
-- 5. Super Admin RLS — PROFILES (update any profile)
-- ═══════════════════════════════════════════════════════
-- Keep existing self-update policy; add super admin update-all policy
CREATE POLICY "Super admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.is_super_admin = true
    )
  );

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.is_super_admin = true
    )
  );

-- ═══════════════════════════════════════════════════════
-- 6. Super Admin RLS — TEAMS (full CRUD)
-- ═══════════════════════════════════════════════════════
-- Read is already public. Add update/delete/insert for super admins.
DROP POLICY IF EXISTS "Coaches can update own team" ON teams;

CREATE POLICY "Coaches can update own team" ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.team_id = teams.id
      AND profiles.role = 'coach'
      AND profiles.approved = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can delete teams"
  ON teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ═══════════════════════════════════════════════════════
-- 7. Super Admin RLS — SEASONS
-- ═══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Coaches can manage seasons" ON seasons;
DROP POLICY IF EXISTS "Coaches can update seasons" ON seasons;
DROP POLICY IF EXISTS "Coaches can delete seasons" ON seasons;

CREATE POLICY "Coaches can manage seasons" ON seasons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = seasons.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can update seasons" ON seasons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = seasons.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can delete seasons" ON seasons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = seasons.team_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ═══════════════════════════════════════════════════════
-- 8. Super Admin RLS — FAVORITES (read all for admin view)
-- ═══════════════════════════════════════════════════════
CREATE POLICY "Super admins can read all favorites"
  ON favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ═══════════════════════════════════════════════════════
-- 9. Super Admin RLS — TFRRS_MEET_LINKS
-- ═══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Coaches can insert TFRRS meet links" ON tfrrs_meet_links;
DROP POLICY IF EXISTS "Coaches can update TFRRS meet links" ON tfrrs_meet_links;
DROP POLICY IF EXISTS "Coaches can delete TFRRS meet links" ON tfrrs_meet_links;

CREATE POLICY "Coaches can insert TFRRS meet links" ON tfrrs_meet_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can update TFRRS meet links" ON tfrrs_meet_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can delete TFRRS meet links" ON tfrrs_meet_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ═══════════════════════════════════════════════════════
-- 10. Super Admin RLS — EVENTS (coaches can already write, add super admin)
-- ═══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Coaches can insert events" ON events;
DROP POLICY IF EXISTS "Coaches can update events" ON events;

CREATE POLICY "Coaches can insert events" ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Coaches can update events" ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );
