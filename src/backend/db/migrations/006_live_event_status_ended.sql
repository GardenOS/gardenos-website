-- Allow live_events.status to include 'ended'
ALTER TABLE live_events
  DROP CONSTRAINT IF EXISTS live_events_status_check;

ALTER TABLE live_events
  ADD CONSTRAINT live_events_status_check
  CHECK (status IN ('prelive', 'live', 'replay', 'ended'));