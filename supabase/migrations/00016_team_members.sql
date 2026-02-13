-- Migration: 00016_team_members.sql
-- Many-to-many relationship: users can belong to multiple teams with different roles

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('coach', 'parent', 'athlete')) DEFAULT 'parent',
  approved boolean NOT NULL DEFAULT false,
  is_owner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, team_id)
);

CREATE INDEX idx_team_members_profile ON team_members (profile_id);
CREATE INDEX idx_team_members_team ON team_members (team_id);
CREATE INDEX idx_team_members_team_role ON team_members (team_id, role);

-- RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can read team memberships
CREATE POLICY "Public read team_members" ON team_members FOR SELECT USING (true);

-- Users can insert their own membership (joining a team)
CREATE POLICY "Users can join teams" ON team_members FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Coaches/owners can update memberships for their team
CREATE POLICY "Team coaches can update members" ON team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = team_members.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

-- Coaches/owners can remove members from their team
CREATE POLICY "Team coaches can delete members" ON team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = team_members.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
    OR auth.uid() = profile_id  -- users can leave teams
  );

-- ═══ Backfill from existing profiles.team_id ═══
-- Move all existing user-team relationships into team_members
INSERT INTO team_members (profile_id, team_id, role, approved, is_owner)
SELECT
  p.id,
  p.team_id,
  p.role,
  p.approved,
  -- Mark as owner if they're the team creator (created_by) or if grandfathered
  COALESCE(t.created_by = p.id, false)
FROM profiles p
JOIN teams t ON t.id = p.team_id
WHERE p.team_id IS NOT NULL
ON CONFLICT (profile_id, team_id) DO NOTHING;

-- ═══ Update RLS policies to use team_members ═══

-- ATHLETES: coaches can manage athletes on their teams
DROP POLICY IF EXISTS "Coaches can insert athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can update athletes" ON athletes;
DROP POLICY IF EXISTS "Coaches can delete athletes" ON athletes;

CREATE POLICY "Coaches can insert athletes" ON athletes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = athletes.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can update athletes" ON athletes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = athletes.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can delete athletes" ON athletes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = athletes.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

-- MEETS: coaches can manage meets on their teams
DROP POLICY IF EXISTS "Coaches can insert meets" ON meets;
DROP POLICY IF EXISTS "Coaches can update meets" ON meets;
DROP POLICY IF EXISTS "Coaches can delete meets" ON meets;

CREATE POLICY "Coaches can insert meets" ON meets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = meets.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can update meets" ON meets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = meets.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can delete meets" ON meets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = meets.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

-- MEET ENTRIES: coaches can manage entries for their team's meets
DROP POLICY IF EXISTS "Coaches can insert meet_entries" ON meet_entries;
DROP POLICY IF EXISTS "Coaches can update meet_entries" ON meet_entries;
DROP POLICY IF EXISTS "Coaches can delete meet_entries" ON meet_entries;

CREATE POLICY "Coaches can insert meet_entries" ON meet_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meets m
      JOIN team_members tm ON tm.team_id = m.team_id
      WHERE m.id = meet_entries.meet_id
      AND tm.profile_id = auth.uid()
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can update meet_entries" ON meet_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meets m
      JOIN team_members tm ON tm.team_id = m.team_id
      WHERE m.id = meet_entries.meet_id
      AND tm.profile_id = auth.uid()
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can delete meet_entries" ON meet_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meets m
      JOIN team_members tm ON tm.team_id = m.team_id
      WHERE m.id = meet_entries.meet_id
      AND tm.profile_id = auth.uid()
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

-- SEASONS: coaches can manage seasons for their teams
DROP POLICY IF EXISTS "Coaches can insert seasons" ON seasons;
DROP POLICY IF EXISTS "Coaches can update seasons" ON seasons;
DROP POLICY IF EXISTS "Coaches can delete seasons" ON seasons;

CREATE POLICY "Coaches can insert seasons" ON seasons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = seasons.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can update seasons" ON seasons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = seasons.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can delete seasons" ON seasons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = seasons.team_id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

-- TEAMS: team coaches can update their own team
DROP POLICY IF EXISTS "Coaches can update own team" ON teams;

CREATE POLICY "Coaches can update own team" ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.profile_id = auth.uid()
      AND tm.team_id = teams.id
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );
