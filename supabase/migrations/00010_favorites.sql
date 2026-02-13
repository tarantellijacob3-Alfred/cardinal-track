-- Migration 00010: Favorites table for parent/athlete saved athletes
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, athlete_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_profile_id ON favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorites_athlete_id ON favorites(athlete_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Public can read their own favorites (must be authenticated)
CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = profile_id);
