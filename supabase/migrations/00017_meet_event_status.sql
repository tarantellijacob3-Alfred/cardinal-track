-- Migration: 00017_meet_event_status.sql
-- Per-meet event activation/deactivation
-- No row = event is active (default). Row with active=false = deactivated for that meet.

CREATE TABLE IF NOT EXISTS meet_event_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meet_id uuid NOT NULL REFERENCES meets(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meet_id, event_id)
);

CREATE INDEX idx_meet_event_status_meet ON meet_event_status (meet_id);

ALTER TABLE meet_event_status ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Public read meet_event_status" ON meet_event_status FOR SELECT USING (true);

-- Coaches can manage (via team_members through meets)
CREATE POLICY "Coaches can insert meet_event_status" ON meet_event_status FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meets m
      JOIN team_members tm ON tm.team_id = m.team_id
      WHERE m.id = meet_event_status.meet_id
      AND tm.profile_id = auth.uid()
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can update meet_event_status" ON meet_event_status FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meets m
      JOIN team_members tm ON tm.team_id = m.team_id
      WHERE m.id = meet_event_status.meet_id
      AND tm.profile_id = auth.uid()
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );

CREATE POLICY "Coaches can delete meet_event_status" ON meet_event_status FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meets m
      JOIN team_members tm ON tm.team_id = m.team_id
      WHERE m.id = meet_event_status.meet_id
      AND tm.profile_id = auth.uid()
      AND tm.role = 'coach'
      AND tm.approved = true
    )
  );
