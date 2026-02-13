# Migrations Phase 2 — Favorites & TFRRS

**Run these in the Supabase SQL Editor for project `wusgkllzmopflpuizanr`.**  
**Run them in order: Migration 00010 first, then 00011.**

---

## Migration 00010: Favorites Table

Copy and paste this entire block into the SQL Editor and click "Run":

```sql
-- Migration 00010: Favorites table for parent/athlete saved athletes

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
```

---

## Migration 00011: TFRRS Linking

Copy and paste this entire block into the SQL Editor and click "Run":

```sql
-- Migration 00011: TFRRS linking support

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

-- Coaches can insert TFRRS meet links
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
```

---

## Verification

After running both migrations, verify in the Supabase Table Editor:

1. **favorites** table exists with columns: `id`, `profile_id`, `athlete_id`, `created_at`
2. **tfrrs_meet_links** table exists with columns: `id`, `meet_id`, `tfrrs_url`, `created_at`
3. **athletes** table has a new `tfrrs_url` column (nullable text)
4. RLS is enabled on both new tables (check under Authentication → Policies)
