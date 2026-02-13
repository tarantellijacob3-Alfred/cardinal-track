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
