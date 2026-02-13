-- Migration 00011: TFRRS linking support
-- Run this in Supabase SQL Editor

-- Add TFRRS profile URL to athletes
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS tfrrs_url text;

-- TFRRS meet results links
CREATE TABLE IF NOT EXISTS tfrrs_meet_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meet_id uuid NOT NULL REFERENCES meets(id) ON DELETE CASCADE,
  tfrrs_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for looking up TFRRS links by meet
CREATE INDEX IF NOT EXISTS idx_tfrrs_meet_links_meet_id ON tfrrs_meet_links(meet_id);

-- Enable RLS
ALTER TABLE tfrrs_meet_links ENABLE ROW LEVEL SECURITY;

-- Public can read TFRRS meet links
CREATE POLICY "Public can read TFRRS meet links"
  ON tfrrs_meet_links FOR SELECT
  USING (true);

-- Coaches can insert TFRRS meet links (check via profiles table)
CREATE POLICY "Coaches can insert TFRRS meet links"
  ON tfrrs_meet_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'coach'
        AND profiles.approved = true
    )
  );

-- Coaches can update TFRRS meet links
CREATE POLICY "Coaches can update TFRRS meet links"
  ON tfrrs_meet_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'coach'
        AND profiles.approved = true
    )
  );

-- Coaches can delete TFRRS meet links
CREATE POLICY "Coaches can delete TFRRS meet links"
  ON tfrrs_meet_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'coach'
        AND profiles.approved = true
    )
  );
