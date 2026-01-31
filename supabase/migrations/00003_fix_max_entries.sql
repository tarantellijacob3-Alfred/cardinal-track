-- Fix max_entries: per-event cap was incorrectly set to 4
-- The 4-event limit is per-athlete, not per-event
-- Set non-relay events to 99 (effectively unlimited)
-- Set relay events to 8 (A team + alternates)
UPDATE events SET max_entries = 99 WHERE is_relay = false;
UPDATE events SET max_entries = 8 WHERE is_relay = true;
