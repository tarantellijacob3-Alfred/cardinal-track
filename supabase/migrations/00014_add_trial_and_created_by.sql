-- Migration: 00014_add_trial_and_created_by.sql
-- Add trial expiration and team creator tracking

-- trial_expires_at: when the free trial ends (null = no trial / grandfathered)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;

-- created_by: the user who created the team (for billing ownership)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Bishop Snyder is grandfathered — no trial expiration
-- (is_grandfathered = true already, trial_expires_at stays null)

-- Index for quick trial expiration checks
CREATE INDEX IF NOT EXISTS idx_teams_trial_expires ON teams (trial_expires_at) WHERE trial_expires_at IS NOT NULL;
