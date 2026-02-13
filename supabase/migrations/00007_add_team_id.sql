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
