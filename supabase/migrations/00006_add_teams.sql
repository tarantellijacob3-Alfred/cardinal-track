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
