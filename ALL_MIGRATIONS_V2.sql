-- Migration: 00006_add_teams.sql
-- Create the teams table for multi-team support

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  school_name text NOT NULL,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#8B0000',
  secondary_color text NOT NULL DEFAULT '#1a1a2e',
  stripe_subscription_id text,
  is_grandfathered boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index on slug for fast lookups
CREATE INDEX idx_teams_slug ON teams (slug);
CREATE INDEX idx_teams_active ON teams (active);

-- RLS: public read, only global admins can write (for now)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert teams" ON teams FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Coaches can update own team" ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.team_id = teams.id
      AND profiles.role = 'coach'
      AND profiles.approved = true
    )
  );


-- ===== MIGRATION 2 =====

-- Migration: 00007_add_team_id.sql
-- Add team_id (nullable first) to athletes, meets, profiles

-- Add team_id column to athletes
ALTER TABLE athletes ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE CASCADE;

-- Add team_id column to meets  
ALTER TABLE meets ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE CASCADE;

-- Add team_id column to profiles
ALTER TABLE profiles ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_athletes_team_id ON athletes (team_id);
CREATE INDEX idx_meets_team_id ON meets (team_id);
CREATE INDEX idx_profiles_team_id ON profiles (team_id);


-- ===== MIGRATION 3 =====

-- Migration: 00008_seed_bishop_snyder.sql
-- Insert Bishop Snyder team and backfill all existing data

-- Insert Bishop Snyder as the founding team (grandfathered = FREE FOREVER)
INSERT INTO teams (id, name, slug, school_name, logo_url, primary_color, secondary_color, is_grandfathered, active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Cardinal Track',
  'bishop-snyder',
  'Bishop Snyder High School',
  '/cardinal-logo.jpg',
  '#C8102E',
  '#09090b',
  true,
  true
);

-- Backfill ALL existing athletes with Bishop Snyder's team_id
UPDATE athletes SET team_id = 'a0000000-0000-0000-0000-000000000001' WHERE team_id IS NULL;

-- Backfill ALL existing meets with Bishop Snyder's team_id
UPDATE meets SET team_id = 'a0000000-0000-0000-0000-000000000001' WHERE team_id IS NULL;

-- Backfill ALL existing profiles with Bishop Snyder's team_id
UPDATE profiles SET team_id = 'a0000000-0000-0000-0000-000000000001' WHERE team_id IS NULL;

-- Now make team_id NOT NULL on athletes and meets (required going forward)
ALTER TABLE athletes ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE meets ALTER COLUMN team_id SET NOT NULL;
-- profiles.team_id stays nullable (global admins may not have a team)


-- ===== MIGRATION 4 =====

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
