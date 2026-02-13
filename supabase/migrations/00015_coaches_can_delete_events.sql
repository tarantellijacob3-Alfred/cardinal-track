-- Migration: 00015_coaches_can_delete_events.sql
-- Allow coaches to delete events (was missing from original RLS policies)

CREATE POLICY "Coaches can delete events" ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
      AND profiles.approved = true
    )
  );
