-- ===== MIGRATION 1: Create teams table (without team_id policy) =====

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

CREATE INDEX idx_teams_slug ON teams (slug);
CREATE INDEX idx_teams_active ON teams (active);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert teams" ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ===== MIGRATION 2: Add team_id columns =====

ALTER TABLE athletes ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE meets ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX idx_athletes_team_id ON athletes (team_id);
CREATE INDEX idx_meets_team_id ON meets (team_id);
CREATE INDEX idx_profiles_team_id ON profiles (team_id);

-- Now we can add the team update policy (profiles.team_id exists now)
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


-- ===== MIGRATION 3: Seed Bishop Snyder & backfill =====

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

UPDATE athletes SET team_id = 'a0000000-0000-0000-0000-000000000001' WHERE team_id IS NULL;
UPDATE meets SET team_id = 'a0000000-0000-0000-0000-000000000001' WHERE team_id IS NULL;
UPDATE profiles SET team_id = 'a0000000-0000-0000-0000-000000000001' WHERE team_id IS NULL;

ALTER TABLE athletes ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE meets ALTER COLUMN team_id SET NOT NULL;


-- ===== MIGRATION 4: Update RLS policies =====

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
  );

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
