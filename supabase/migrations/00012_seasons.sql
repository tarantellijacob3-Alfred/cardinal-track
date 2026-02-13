-- Migration 00012: Seasons
-- Adds seasons table, links meets to seasons, seeds Spring 2026 for Bishop Snyder

CREATE TABLE seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_seasons_team_id ON seasons(team_id);
CREATE UNIQUE INDEX idx_seasons_team_active ON seasons(team_id) WHERE is_active = true;

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Coaches can manage seasons" ON seasons FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true AND profiles.team_id = seasons.team_id));
CREATE POLICY "Coaches can update seasons" ON seasons FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true AND profiles.team_id = seasons.team_id));
CREATE POLICY "Coaches can delete seasons" ON seasons FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'coach' AND profiles.approved = true AND profiles.team_id = seasons.team_id));

-- Add season_id to meets
ALTER TABLE meets ADD COLUMN season_id uuid REFERENCES seasons(id) ON DELETE SET NULL;
CREATE INDEX idx_meets_season_id ON meets(season_id);

-- Seed: Create a default "Spring 2026" season for Bishop Snyder and link existing meets
INSERT INTO seasons (id, team_id, name, start_date, is_active)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Spring 2026', '2026-01-01', true);

UPDATE meets SET season_id = 'b0000000-0000-0000-0000-000000000001' WHERE team_id = 'a0000000-0000-0000-0000-000000000001';
