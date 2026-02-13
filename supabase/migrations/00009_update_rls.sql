-- Migration: 00009_update_rls.sql
-- Update RLS policies for team-scoped writes while preserving public reads

-- ═══════════════════════════════════════════════════════
-- ATHLETES: Drop old write policies, create team-scoped ones
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Coaches can insert athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can update athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can delete athletes" ON athletes;

-- Coaches can only insert athletes into their own team
CREATE POLICY "Coaches can insert athletes" ON athletes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = athletes.team_id
    )
  );

-- Coaches can only update athletes on their own team
CREATE POLICY "Coaches can update athletes" ON athletes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = athletes.team_id
    )
  );

-- Coaches can only delete athletes on their own team
CREATE POLICY "Coaches can delete athletes" ON athletes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
      AND profiles.team_id = athletes.team_id
    )
  );

-- ═══════════════════════════════════════════════════════
-- MEETS: Drop old write policies, create team-scoped ones
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
  );

-- ═══════════════════════════════════════════════════════
-- MEET_ENTRIES: Drop old write policies, create team-scoped ones
-- (scoped through the meet's team_id)
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
  );

-- ═══════════════════════════════════════════════════════
-- EVENTS: Keep existing policies (events are universal, no team_id)
-- ═══════════════════════════════════════════════════════
-- No changes needed for events - they stay globally writable by any coach

-- ═══════════════════════════════════════════════════════
-- PUBLIC READ policies are PRESERVED (not touched)
-- ═══════════════════════════════════════════════════════
-- "Public read athletes", "Public read events", "Public read meets",
-- "Public read meet_entries", "Anyone can read profiles" all remain.
